import { Resend } from "resend";

type OtpType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email";

type SendOtpEmailInput = {
  email: string;
  otp: string;
  type: OtpType;
};

const subjects: Record<OtpType, string> = {
  "sign-in": "Your MFA System verification code",
  "email-verification": "Verify your email for MFA System",
  "forget-password": "Your MFA System recovery code",
  "change-email": "Confirm your new email for MFA System",
};

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

function renderOtpEmail({ otp, type }: SendOtpEmailInput): string {
  const heading =
    type === "sign-in" ? "Verify your email" : subjects[type];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading}</title>
  </head>
  <body style="margin:0;padding:0;background:#ffffff;color:#0a0a0a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;">
      <tr>
        <td align="center" style="padding:48px 24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;">
            <tr>
              <td style="padding-bottom:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:-0.01em;color:#0a0a0a;">
                MFA System
              </td>
            </tr>
            <tr>
              <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
                <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;font-weight:600;letter-spacing:-0.03em;color:#0a0a0a;">
                  ${heading}
                </h1>
                <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#52525b;">
                  Use the six-digit code below to continue. It expires in 10 minutes.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
                  <tr>
                    <td align="center" style="padding:28px 16px;">
                      <span style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:36px;line-height:1;font-weight:500;letter-spacing:0.22em;color:#0a0a0a;">
                        ${otp}
                      </span>
                    </td>
                  </tr>
                </table>
                <p style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
                  If you did not request this code, you can safely ignore this email. No one can access your account with it.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding-top:40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#a1a1aa;">
                MFA System &middot; Passwordless authentication with email OTP and TOTP.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendOtpEmail(input: SendOtpEmailInput): Promise<void> {
  const resend = getResendClient();

  if (!resend) {
    // Local development fallback. Never enabled in production.
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `\n[auth] ${input.type} OTP for ${input.email}: ${input.otp}\n`,
      );
      return;
    }

    throw new Error(
      "Email delivery is not configured. Set RESEND_API_KEY in the environment.",
    );
  }

  const from =
    process.env.EMAIL_FROM || "MFA System <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: input.email,
    subject: subjects[input.type],
    html: renderOtpEmail(input),
    text: `Your MFA System code is ${input.otp}. It expires in 10 minutes. If you did not request it, ignore this email.`,
  });

  if (error) {
    console.error("[auth] Resend rejected the OTP email:", error);
    throw new Error("Email delivery failed. Check the server logs.");
  }
}
