#!/usr/bin/env node
/**
 * Database migration for MFA System on Turso Cloud (LibSQL).
 *
 * Run: npm run migrate
 *
 * The script is idempotent. It creates missing Better Auth tables, adds the
 * columns introduced by the two-factor and JWT plugins, and backfills the
 * verified flag for accounts that enabled TOTP before that column existed.
 */

import nextEnv from "@next/env";
import { createClient } from "@libsql/client";

nextEnv.loadEnvConfig(process.cwd());

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error(
    "TURSO_DATABASE_URL is not set. Add it to .env.local before running migrations.",
  );
  process.exit(1);
}

const db = createClient({ url, authToken });

const tables = [
  {
    name: "user",
    sql: `CREATE TABLE IF NOT EXISTS "user" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "emailVerified" INTEGER NOT NULL DEFAULT 0,
      "image" TEXT,
      "createdAt" INTEGER NOT NULL,
      "updatedAt" INTEGER NOT NULL,
      "twoFactorEnabled" INTEGER NOT NULL DEFAULT 0
    )`,
  },
  {
    name: "session",
    sql: `CREATE TABLE IF NOT EXISTS "session" (
      "id" TEXT PRIMARY KEY,
      "expiresAt" INTEGER NOT NULL,
      "token" TEXT NOT NULL UNIQUE,
      "createdAt" INTEGER NOT NULL,
      "updatedAt" INTEGER NOT NULL,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
    )`,
  },
  {
    name: "account",
    sql: `CREATE TABLE IF NOT EXISTS "account" (
      "id" TEXT PRIMARY KEY,
      "accountId" TEXT NOT NULL,
      "providerId" TEXT NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "accessToken" TEXT,
      "refreshToken" TEXT,
      "idToken" TEXT,
      "accessTokenExpiresAt" INTEGER,
      "refreshTokenExpiresAt" INTEGER,
      "scope" TEXT,
      "password" TEXT,
      "createdAt" INTEGER NOT NULL,
      "updatedAt" INTEGER NOT NULL
    )`,
  },
  {
    name: "verification",
    sql: `CREATE TABLE IF NOT EXISTS "verification" (
      "id" TEXT PRIMARY KEY,
      "identifier" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "expiresAt" INTEGER NOT NULL,
      "createdAt" INTEGER,
      "updatedAt" INTEGER
    )`,
  },
  {
    name: "twoFactor",
    sql: `CREATE TABLE IF NOT EXISTS "twoFactor" (
      "id" TEXT PRIMARY KEY,
      "secret" TEXT NOT NULL,
      "backupCodes" TEXT NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "verified" INTEGER NOT NULL DEFAULT 1,
      "failedVerificationCount" INTEGER NOT NULL DEFAULT 0,
      "lockedUntil" INTEGER
    )`,
  },
  {
    name: "rateLimit",
    sql: `CREATE TABLE IF NOT EXISTS "rateLimit" (
      "id" TEXT PRIMARY KEY,
      "key" TEXT NOT NULL UNIQUE,
      "count" INTEGER NOT NULL DEFAULT 0,
      "lastRequest" INTEGER NOT NULL
    )`,
  },
  {
    name: "jwks",
    sql: `CREATE TABLE IF NOT EXISTS "jwks" (
      "id" TEXT PRIMARY KEY,
      "publicKey" TEXT NOT NULL,
      "privateKey" TEXT NOT NULL,
      "createdAt" INTEGER NOT NULL,
      "expiresAt" INTEGER,
      "alg" TEXT,
      "crv" TEXT
    )`,
  },
];

const indexes = [
  `CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId")`,
  `CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId")`,
  `CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier")`,
  `CREATE INDEX IF NOT EXISTS "twoFactor_userId_idx" ON "twoFactor" ("userId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "rateLimit_key_idx" ON "rateLimit" ("key")`,
];

const alterations = [
  `ALTER TABLE "user" ADD COLUMN "twoFactorEnabled" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "twoFactor" ADD COLUMN "verified" INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE "twoFactor" ADD COLUMN "failedVerificationCount" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "twoFactor" ADD COLUMN "lockedUntil" INTEGER`,
];

const backfills = [
  `UPDATE "twoFactor"
     SET "verified" = 1
   WHERE ("verified" IS NULL OR "verified" = 0)
     AND "userId" IN (SELECT "id" FROM "user" WHERE "twoFactorEnabled" = 1)`,
];

console.log("Running MFA System database migrations...\n");

for (const table of tables) {
  await db.execute(table.sql);
  console.log(`  [ok] table ${table.name}`);
}

console.log("");

for (const statement of indexes) {
  await db.execute(statement);
  console.log(`  [ok] ${indexName(statement)}`);
}

console.log("");

for (const statement of alterations) {
  try {
    await db.execute(statement);
    console.log(`  [ok] column ${columnName(statement)}`);
  } catch (error) {
    if (isDuplicateColumnError(error)) {
      console.log(`  [skip] column ${columnName(statement)} already exists`);
      continue;
    }

    throw error;
  }
}

for (const statement of backfills) {
  const result = await db.execute(statement);
  console.log(`  [ok] backfilled ${result.rowsAffected} twoFactor row(s)`);
}

console.log("\nMigrations complete.");

function indexName(sql) {
  return sql.match(/CREATE (?:UNIQUE )?INDEX IF NOT EXISTS "([^"]+)"/)?.[1];
}

function columnName(sql) {
  return sql.match(/ADD COLUMN "([^"]+)"/)?.[1];
}

function isDuplicateColumnError(error) {
  return /duplicate column name/i.test(String(error?.message || ""));
}
