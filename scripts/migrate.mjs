#!/usr/bin/env node
/**
 * Database migration script for Better Auth with Turso Cloud
 * Run: node scripts/migrate.mjs
 */

import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Better Auth required tables
const migrations = [
  // Users table
  `CREATE TABLE IF NOT EXISTS "user" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "emailVerified" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "twoFactorEnabled" INTEGER NOT NULL DEFAULT 0
  )`,

  // Sessions table
  `CREATE TABLE IF NOT EXISTS "session" (
    "id" TEXT PRIMARY KEY,
    "expiresAt" INTEGER NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
  )`,

  // Accounts table
  `CREATE TABLE IF NOT EXISTS "account" (
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

  // Verification table
  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" TEXT PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "createdAt" INTEGER,
    "updatedAt" INTEGER
  )`,

  // Two factor table (for twoFactor plugin — Better Auth v1.7)
  `CREATE TABLE IF NOT EXISTS "twoFactor" (
    "id" TEXT PRIMARY KEY,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "verified" INTEGER NOT NULL DEFAULT 0,
    "failedVerificationCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" INTEGER
  )`,
];

// Column additions for existing tables (idempotent — SQLite ignores if already exists via try/catch)
const alterations = [
  `ALTER TABLE "twoFactor" ADD COLUMN "verified" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "twoFactor" ADD COLUMN "failedVerificationCount" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "twoFactor" ADD COLUMN "lockedUntil" INTEGER`,
];

console.log("Running database migrations...");

for (const sql of migrations) {
  try {
    await db.execute(sql);
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS "([^"]+)"/)?.[1];
    console.log(`  ✓ Table "${tableName}" ready`);
  } catch (err) {
    console.error(`  ✗ Migration failed:`, err.message);
    process.exit(1);
  }
}

console.log("Applying column updates...");
for (const sql of alterations) {
  try {
    await db.execute(sql);
    const col = sql.match(/ADD COLUMN "([^"]+)"/)?.[1];
    console.log(`  ✓ Column "${col}" added`);
  } catch (err) {
    // Column already exists — that's fine
    const col = sql.match(/ADD COLUMN "([^"]+)"/)?.[1];
    console.log(`  ~ Column "${col}" already exists`);
  }
}

console.log("\nMigrations complete.");
