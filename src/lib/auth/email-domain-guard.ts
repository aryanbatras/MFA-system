import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { checkEmailDomain } from "@/lib/email/mx";

type EmailOtpBody = {
  email?: string;
};

/**
 * Reject recipient domains that cannot receive mail before an OTP is created
 * or handed to Resend.
 *
 * The check uses MX records, then falls back to A/AAAA records as allowed by
 * RFC 5321. DNS failures that look transient fail open: a resolver outage must
 * not stop legitimate sign-ins. The local console fallback skips the check so
 * reserved domains such as `example.com` remain usable in development.
 */
export function emailDomainGuard(): BetterAuthPlugin {
  return {
    id: "email-domain-guard",
    hooks: {
      before: [
        {
          matcher: (context) =>
            context.path === "/email-otp/send-verification-otp",
          handler: createAuthMiddleware(async (ctx) => {
            if (!process.env.RESEND_API_KEY) return;

            const email = (ctx.body as EmailOtpBody | undefined)?.email
              ?.trim()
              .toLowerCase();

            if (!email) return;

            const status = await checkEmailDomain(email);

            if (status === "undeliverable") {
              throw APIError.from("BAD_REQUEST", {
                code: "EMAIL_DOMAIN_UNREACHABLE",
                message:
                  "That email domain cannot receive mail. Check the address and try again.",
              });
            }
          }),
        },
      ],
    },
  };
}
