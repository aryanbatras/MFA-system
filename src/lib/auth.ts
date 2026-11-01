import { betterAuth } from "better-auth";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { Kysely } from "kysely";
import { LibsqlDialect } from "kysely-libsql";
import { twoFactor } from "better-auth/plugins";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || tursoUrl.includes("REPLACE_WITH")) {
  console.error(
    "\n❌ [MFA System] TURSO_DATABASE_URL is not configured.\n" +
    "   1. Go to https://app.turso.tech and create a database.\n" +
    "   2. Copy the database URL and auth token into .env.local\n"
  );
}

const db = new Kysely({
  dialect: new LibsqlDialect({
    url: tursoUrl || "libsql://placeholder.turso.io",
    authToken: tursoToken || "",
  }),
});

export const auth = betterAuth({
  database: kyselyAdapter(db, {
    type: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    twoFactor({
      issuer: "MFA System",
      totpOptions: {
        digits: 6,
        period: 30,
      },
    }),
  ],
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export type Session = typeof auth.$Infer.Session;
