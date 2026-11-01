import { betterAuth } from "better-auth";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { Kysely } from "kysely";
import { LibsqlDialect } from "kysely-libsql";
import { emailOTP, jwt, twoFactor } from "better-auth/plugins";
import { emailDomainGuard } from "@/lib/auth/email-domain-guard";
import { emailOtpAccountGuard } from "@/lib/auth/email-otp-account-guard";
import { emailOtpTwoFactorChallenge } from "@/lib/auth/email-otp-two-factor";
import { sendOtpEmail } from "@/lib/email";
import { getAppUrl, getTrustedOrigins } from "@/lib/url";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;
const secret = process.env.BETTER_AUTH_SECRET;

if (!tursoUrl) {
  throw new Error("TURSO_DATABASE_URL is not set. Add it to .env.local.");
}

if (!secret || secret.length < 32) {
  throw new Error(
    "BETTER_AUTH_SECRET must be set to at least 32 characters. Generate one with `openssl rand -base64 32`.",
  );
}

const db = new Kysely({
  dialect: new LibsqlDialect({
    url: tursoUrl,
    authToken: tursoToken,
  }),
});

const appUrl = getAppUrl();

export const auth = betterAuth({
  appName: "MFA System",
  baseURL: appUrl,
  secret,
  database: kyselyAdapter(db, { type: "sqlite" }),

  // Passwordless only. There is no credential/password sign-in path.
  emailAndPassword: {
    enabled: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh the expiry once per day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  },

  // Durable, database-backed rate limiting works across serverless instances.
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/two-factor/enable": { window: 60, max: 5 },
      "/two-factor/verify-totp": { window: 60, max: 10 },
      "/two-factor/verify-backup-code": { window: 60, max: 10 },
    },
  },

  plugins: [
    emailOTP({
      expiresIn: 10 * 60,
      otpLength: 6,
      allowedAttempts: 5,
      // The plaintext code is never persisted.
      storeOTP: "hashed",
      rateLimit: { window: 60, max: 3 },
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpEmail({ email, otp, type });
      },
    }),
    twoFactor({
      issuer: "MFA System",
      allowPasswordless: true,
      twoFactorCookieMaxAge: 10 * 60,
      totpOptions: {
        digits: 6,
        period: 30,
      },
      backupCodeOptions: {
        amount: 10,
        length: 10,
        storeBackupCodes: "encrypted",
      },
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 10,
        durationSeconds: 15 * 60,
      },
    }),
    // Login and signup share the email-OTP endpoints. This guard keeps a
    // mistyped login from silently creating a new account, and points an
    // existing address on the signup screen back to sign-in.
    emailOtpAccountGuard(),
    // Reject recipient domains with no MX/A records before Resend is called.
    emailDomainGuard(),
    // Email OTP signs the user in before the built-in two-factor hook can run.
    // This plugin closes that gap and turns every OTP sign-in into a TOTP challenge.
    emailOtpTwoFactorChallenge(),
    jwt({
      jwt: {
        issuer: appUrl,
        audience: appUrl,
        expirationTime: "15m",
      },
    }),
  ],

  trustedOrigins: getTrustedOrigins(appUrl),
});

export type Session = typeof auth.$Infer.Session;
