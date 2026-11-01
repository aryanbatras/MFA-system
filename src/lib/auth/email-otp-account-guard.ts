import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";

const FLOW_HEADER = "x-auth-flow";

type Flow = "sign-in" | "sign-up";

type EmailOtpBody = {
  email?: string;
  type?: string;
};

/**
 * The login and signup screens share Better Auth's email-OTP endpoints. By
 * default, `/sign-in/email-otp` creates an account when the address is new,
 * which makes a mistyped login silently become a signup.
 *
 * The browser marks its intent with `x-auth-flow`. This guard enforces:
 *
 * - sign-in requires an existing account
 * - sign-up requires a new address
 *
 * Requests without the header are treated as sign-in, so an unknown address
 * cannot create an account by omitting it. Signup is still public and can
 * create accounts; the header only separates the two product flows.
 */
export function emailOtpAccountGuard(): BetterAuthPlugin {
  return {
    id: "email-otp-account-guard",
    hooks: {
      before: [
        {
          matcher: (context) =>
            context.path === "/email-otp/send-verification-otp" ||
            context.path === "/sign-in/email-otp",
          handler: createAuthMiddleware(async (ctx) => {
            const body = ctx.body as EmailOtpBody | undefined;

            // Only the sign-in OTP flow is gated. Password reset and email
            // verification use other types and must keep their own semantics.
            if (
              ctx.path === "/email-otp/send-verification-otp" &&
              body?.type !== "sign-in"
            ) {
              return;
            }

            const email = body?.email?.trim().toLowerCase();
            if (!email) return;

            const flow = readFlow(ctx.headers);
            const existing = await ctx.context.internalAdapter.findUserByEmail(
              email,
            );

            if (flow === "sign-in" && !existing) {
              throw APIError.from("NOT_FOUND", {
                code: "ACCOUNT_NOT_FOUND",
                message:
                  "No account exists for this email. Create an account to continue.",
              });
            }

            if (flow === "sign-up" && existing) {
              throw APIError.from("CONFLICT", {
                code: "ACCOUNT_ALREADY_EXISTS",
                message:
                  "An account already exists for this email. Sign in instead.",
              });
            }
          }),
        },
      ],
    },
  };
}

function readFlow(headers: Headers | undefined): Flow {
  const value = headers?.get(FLOW_HEADER)?.trim().toLowerCase();
  return value === "sign-up" ? "sign-up" : "sign-in";
}
