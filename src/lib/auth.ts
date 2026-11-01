import { betterAuth } from "better-auth";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { Kysely } from "kysely";
import { LibsqlDialect } from "kysely-libsql";
import { twoFactor, emailOTP } from "better-auth/plugins";
import { Resend } from "resend";

const db = new Kysely({
  dialect: new LibsqlDialect({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  }),
});

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: kyselyAdapter(db, { type: "sqlite" }),
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const subjects: Record<string, string> = {
          "sign-in": "Your sign-in code",
          "email-verification": "Verify your email",
          "forget-password": "Your reset code",
        };
        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: email,
          subject: subjects[type] ?? "Your verification code",
          html: `
            <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#09090b;">
              <p style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a1a1aa;margin:0 0 24px;">MFA System</p>
              <h1 style="font-size:28px;font-weight:600;letter-spacing:-0.03em;margin:0 0 8px;line-height:1.15;">${subjects[type] ?? "Your code"}</h1>
              <p style="font-size:14px;color:#71717a;margin:0 0 32px;line-height:1.5;">Use the code below to continue. It expires in 10 minutes.</p>
              <div style="background:#fafafa;border:1px solid #e4e4e7;padding:24px;text-align:center;margin-bottom:32px;">
                <span style="font-family:monospace;font-size:36px;font-weight:600;letter-spacing:0.2em;color:#09090b;">${otp}</span>
              </div>
              <p style="font-size:12px;color:#a1a1aa;margin:0;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        });
      },
      expiresIn: 600, // 10 minutes
      otpLength: 6,
    }),
    twoFactor({
      issuer: "MFA System",
      totpOptions: { digits: 6, period: 30 },
    }),
  ],
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://mfa-auth-systems.vercel.app",
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export type Session = typeof auth.$Infer.Session;
