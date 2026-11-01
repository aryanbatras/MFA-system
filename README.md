# MFA System

Enterprise-grade Multi-Factor Authentication built with Next.js 15, Better Auth, and Turso Cloud (LibSQL).

> **Built with [IBM Bob](https://www.ibm.com/bob)** — AI-powered software engineering tool by IBM.

---

## Overview

A production-ready authentication system featuring:

- **Email + Password authentication** via Better Auth
- **TOTP-based 2FA** (Google Authenticator, Authy, 1Password, any RFC 6238-compliant app)
- **Serverless-ready** — deploys to Vercel, Netlify, or any Next.js-compatible host
- **Turso Cloud database** — globally distributed LibSQL (SQLite-compatible)
- **No third-party OAuth required** — entirely self-hosted identity flow

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Authentication | Better Auth v1 |
| Database | Turso Cloud (LibSQL via Kysely) |
| MFA | TOTP / RFC 6238 (Google Authenticator compatible) |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI primitives |
| Typography | DM Sans (Google Fonts) |
| Images | Pexels API |
| Language | TypeScript |

---

## Authentication Flow

```
Sign Up → Email/Password → MFA Setup (scan QR) → Dashboard
Sign In → Email/Password → MFA Verify (enter code) → Dashboard
```

1. **Sign Up**: User registers with name, email, and password
2. **MFA Setup**: TOTP secret generated, QR code displayed for authenticator app
3. **Sign In**: Email/password verified, then TOTP code required
4. **Session**: JWT session issued by Better Auth, stored securely

---

## Prerequisites

Before running this project, you need:

### 1. Node.js
- Version **18.17+** required (tested on Node 26)

### 2. Turso Cloud Database
- Create a free account at [https://app.turso.tech](https://app.turso.tech)
- Create a new database
- Obtain your **Database URL** and **Auth Token**:
  ```bash
  turso db show YOUR_DB_NAME --url
  turso db tokens create YOUR_DB_NAME
  ```

### 3. Better Auth Secret
Generate a cryptographically secure secret:
```bash
openssl rand -base64 32
```

### 4. Pexels API Key (optional)
Already provided in `.env.example`. Used for background photography on auth pages.

---

## Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/aryanbatras/MFA-system.git
cd MFA-system
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Better Auth Secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-secret-here-minimum-32-characters

# App URL (change for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Turso Database
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# Pexels API (provided)
NEXT_PUBLIC_PEXELS_API_KEY=vquQw21KBZbpFePsBoLGrQp0btek4FGzwvJM9IP7bWvacaEW9WQ2hoFa
```

### 3. Run database migrations

This creates the required tables in your Turso database:

```bash
npm run migrate
```

Tables created:
- `user` — User accounts
- `session` — Active sessions
- `account` — Auth provider accounts
- `verification` — Email/token verification
- `twoFactor` — TOTP secrets and backup codes

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Routes

| Route | Description |
|---|---|
| `/login` | Sign in with email + password |
| `/signup` | Create a new account |
| `/mfa-setup` | Configure TOTP authenticator (post signup) |
| `/mfa-verify` | Enter TOTP code (post login when MFA enabled) |
| `/dashboard` | Authenticated user dashboard |
| `/api/auth/[...all]` | Better Auth API handler (all auth endpoints) |

---

## MFA Setup Guide

After signing up:

1. Open **Google Authenticator**, **Authy**, **1Password**, or any TOTP app
2. Tap **Add account** → **Scan QR code**
3. Scan the QR code shown on the `/mfa-setup` page
4. Enter the **6-digit code** to confirm setup
5. Future logins will require this code

**If you lose access to your authenticator**, use the backup codes provided on setup (stored hashed in the database).

---

## Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel --prod
```

Set environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Self-hosted

```bash
npm run build
npm start
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `BETTER_AUTH_SECRET` | Yes | 32+ char secret for signing sessions |
| `NEXT_PUBLIC_APP_URL` | Yes | Full URL of your app (no trailing slash) |
| `TURSO_DATABASE_URL` | Yes | LibSQL URL from Turso (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Yes | Turso auth token |
| `NEXT_PUBLIC_PEXELS_API_KEY` | No | Pexels API key for background images |

---

## Security Notes

- Passwords are hashed with **bcrypt** (via Better Auth)
- TOTP secrets are stored **encrypted** in the database
- Sessions use **HTTP-only cookies** (not localStorage)
- HTTPS required in production — set `NEXT_PUBLIC_APP_URL` to your HTTPS domain

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx          # Split-screen auth layout
│   │   ├── login/page.tsx      # Sign in page
│   │   ├── signup/page.tsx     # Sign up page
│   │   ├── mfa-setup/page.tsx  # TOTP setup with QR code
│   │   └── mfa-verify/page.tsx # TOTP verification
│   ├── api/auth/[...all]/
│   │   └── route.ts            # Better Auth API handler
│   ├── dashboard/page.tsx      # Authenticated dashboard
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       └── label.tsx
└── lib/
    ├── auth.ts                 # Better Auth server config
    ├── auth-client.ts          # Better Auth client config
    └── utils.ts                # Utility functions
scripts/
└── migrate.mjs                 # Database migration script
```

---

## License

MIT

---

*Built with [IBM Bob](https://www.ibm.com/bob) — the AI software engineering tool that writes, reviews, and ships production code.*
