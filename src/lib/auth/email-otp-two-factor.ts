import type { BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { deleteSessionCookie } from "better-auth/cookies";
import { generateRandomString } from "better-auth/crypto";

const TWO_FACTOR_COOKIE_NAME = "two_factor";
const CHALLENGE_TTL_SECONDS = 10 * 60;

type TwoFactorRecord = {
  id: string;
  verified?: boolean | null;
};

/**
 * Better Auth's two-factor plugin only intercepts credential sign-ins
 * (`/sign-in/email`, `/sign-in/username`, `/sign-in/phone-number`).
 *
 * Email OTP sign-in creates its session through `/sign-in/email-otp`, so it
 * would otherwise bypass TOTP entirely. This hook performs the same challenge
 * hand-off as the built-in plugin: it discards the freshly-created session,
 * writes a short-lived signed challenge cookie, and lets the standard
 * `/two-factor/verify-totp` endpoint finish the sign-in.
 */
export function emailOtpTwoFactorChallenge(): BetterAuthPlugin {
  return {
    id: "email-otp-two-factor-challenge",
    hooks: {
      after: [
        {
          matcher: (context) => context.path === "/sign-in/email-otp",
          handler: createAuthMiddleware(async (ctx) => {
            const newSession = ctx.context.newSession;

            if (!newSession?.user?.twoFactorEnabled) {
              return;
            }

            const twoFactor = (await ctx.context.adapter.findOne({
              model: "twoFactor",
              where: [{ field: "userId", value: newSession.user.id }],
            })) as TwoFactorRecord | null;

            // Challenge whenever the account is flagged as protected, even if
            // the enrollment record looks unfinished. Verification fails
            // closed in that case instead of silently downgrading to email
            // OTP only. (Older databases may predate the `verified` column.)
            if (!twoFactor) {
              ctx.context.logger.error(
                "[auth] twoFactorEnabled user is missing a twoFactor record",
              );
            }

            // The email OTP endpoint already set a session cookie. Remove it
            // from the response and revoke the server-side session before the
            // client can ever see it.
            deleteSessionCookie(ctx, true);
            await ctx.context.internalAdapter.deleteSession(
              newSession.session.token,
            );
            ctx.context.setNewSession(null);

            const cookie = ctx.context.createAuthCookie(
              TWO_FACTOR_COOKIE_NAME,
              { maxAge: CHALLENGE_TTL_SECONDS },
            );
            const identifier = `2fa-${generateRandomString(20)}`;
            const expiresAt = new Date(
              Date.now() + CHALLENGE_TTL_SECONDS * 1000,
            );

            await ctx.context.internalAdapter.createVerificationValue({
              value: newSession.user.id,
              identifier,
              expiresAt,
            });
            await ctx.context.internalAdapter.createVerificationValue({
              value: "0",
              identifier: `2fa-attempts-${identifier}`,
              expiresAt,
            });
            await ctx.setSignedCookie(
              cookie.name,
              identifier,
              ctx.context.secret,
              cookie.attributes,
            );

            return ctx.json({
              twoFactorRedirect: true,
              twoFactorMethods: ["totp"],
            });
          }),
        },
      ],
    },
  };
}
