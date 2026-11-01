# MFA System

Passwordless authentication with an email one-time code as the first factor and a mandatory TOTP authenticator app as the second factor. Built with Next.js, Better Auth, Turso Cloud, and Resend.

> **Built with [IBM Bob](https://www.ibm.com/bob)** — IBM's AI-powered software engineering tool. The application, database migration, documentation, and review were produced with IBM Bob.

---

## What this is

A focused, production-shaped authentication application:

- Sign up with an email address only. There is no name field and no password.
- Sign in with a six-digit email code.
- Every account must connect an authenticator app before it can reach the dashboard.
- Every subsequent sign-in requires the email code **and** a TOTP code.
- Ten single-use recovery codes are generated during setup.
- The dashboard is a protected destination that shows the account's security posture.

The interface is intentionally quiet: white background, Inter typography, square controls, large actions, no decorative gradients, shadows, hover effects, or emoji.

---

## Why `/mfa-setup` no longer asks for a password

Better Auth's two-factor plugin requires a password before enabling TOTP by default. Accounts created through email OTP do not have a credential account, so there is no password to check. That is why the old flow failed or asked for a password that never existed.

This project fixes the root cause in two places:

1. `twoFactor({ allowPasswordless: true })` tells Better Auth to skip the password check when the user has no credential account.
2. The MFA setup UI calls `twoFactor.enable({ method: "totp" })` and goes straight to the QR code. It never renders a password field.

There is no password anywhere in the application. `emailAndPassword.enabled` is `false`.

---

## Authentication flow

### First visit

```
/signup
  -> enter a new email address
  -> receive six-digit code
  -> verify code (email factor)
  -> /mfa-setup
  -> scan QR with Google Authenticator, 1Password, Authy, etc.
  -> confirm one six-digit TOTP code
  -> recovery codes shown once
  -> /dashboard
```

If the address already has an account, signup stops and points to `/login`.

### Returning visit

```
/login
  -> enter an existing email address
  -> receive six-digit code
  -> verify code (email factor)
  -> /mfa-verify
  -> enter TOTP code or a recovery code (second factor)
  -> /dashboard
```

If the address is not in the database, login stops before sending a code and points to `/signup`.

### Mandatory enrollment

The dashboard redirects to `/mfa-setup` whenever `user.twoFactorEnabled` is false. There is no "skip for now" path. An account cannot reach the protected area with only the email factor.

---

## Security model

| Control | Implementation |
|---|---|
| First factor | Better Auth email OTP, six digits, 10-minute expiry |
| OTP storage | Hashed with `storeOTP: "hashed"`; plaintext codes are never persisted |
| OTP attempts | Five attempts per code, then the code is exhausted |
| OTP request limit | Three requests per minute per client and path |
| Second factor | TOTP, six digits, 30-second period, RFC 6238 compatible |
| Second factor enforcement | Custom after-hook on `/sign-in/email-otp`; the session is revoked and replaced with a signed challenge cookie until TOTP succeeds |
| TOTP secret storage | Encrypted by Better Auth using `BETTER_AUTH_SECRET` |
| Recovery codes | Ten codes, formatted `xxxxx-xxxxx`, encrypted at rest, single use |
| Account lockout | Ten failed second-factor attempts lock the account for 15 minutes |
| Session | Seven days, HTTP-only cookie, `SameSite=Lax`, `Secure` in production |
| Session cache | Five-minute signed cookie cache; the database remains the source of truth |
| Rate limiting | Database-backed (`rateLimit` table), so limits hold across serverless instances |
| Recipient validation | The auth serverless function checks the recipient domain's MX records, with an RFC 5321 A/AAAA fallback, before an OTP is sent |
| Login/signup separation | A server-side guard requires an existing account for sign-in and a new address for signup. Unknown logins receive a create-account message; existing signups receive a sign-in message |
| JWT | Better Auth JWT plugin; short-lived tokens available at `/api/auth/token` and public keys at `/api/auth/jwks` |
| Transport headers | `nosniff`, `DENY` framing, strict referrer policy, permissions policy, HSTS and CSP in production |

### The email-OTP MFA bypass, and how it is closed

Better Auth's two-factor plugin intercepts `/sign-in/email`, `/sign-in/username`, and `/sign-in/phone-number`. It does **not** intercept `/sign-in/email-otp`. Without an additional hook, an email OTP sign-in would create a full session and skip TOTP entirely.

`src/lib/auth/email-otp-two-factor.ts` closes that gap. After a successful email OTP sign-in:

1. It reads the freshly created session.
2. If the account has two-factor enabled, it deletes the session cookie and revokes the server-side session.
3. It writes a short-lived signed `two_factor` challenge cookie and verification records.
4. It returns `{ twoFactorRedirect: true, twoFactorMethods: ["totp"] }`.
5. The standard `/two-factor/verify-totp` or `/two-factor/verify-backup-code` endpoint creates the real session only after the second factor succeeds.

The hook fails closed: if an account is flagged as protected but its enrollment record is missing or inconsistent, no usable session is issued.

### Login and signup are separate flows

Better Auth's email-OTP sign-in endpoint creates an account when the address is new. That is useful for a pure passwordless product, but it makes a mistyped login silently become a signup. This build separates the two flows:

- The browser marks its intent with the `x-auth-flow` header (`sign-in` or `sign-up`).
- `src/lib/auth/email-otp-account-guard.ts` runs before `/email-otp/send-verification-otp` and `/sign-in/email-otp`.
- `sign-in` requires an existing user. An unknown address gets `ACCOUNT_NOT_FOUND` and a **Create an account** link; no code is sent.
- `sign-up` requires a new address. An existing address gets `ACCOUNT_ALREADY_EXISTS` and a **Sign in** link; no code is sent.
- Requests without the header default to `sign-in`, so omitting it cannot create an account.

This is a deliberate tradeoff: the login screen now reveals whether an address is registered. That is the behavior this product wants, and it is documented rather than hidden. The check is a product-flow guard, not a security boundary; signup is public by design.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Authentication | Better Auth 1.7 |
| Database | Turso Cloud (LibSQL) through Kysely |
| Email | Resend |
| MFA | TOTP through Better Auth's two-factor plugin |
| Styling | Tailwind CSS v4 |
| Primitives | Radix UI |
| Typography | Inter and IBM Plex Mono via `next/font` |
| Photography | Pexels API |
| Language | TypeScript |

---

## Prerequisites

- Node.js **20.9 or newer**
- A Turso Cloud database ([app.turso.tech](https://app.turso.tech))
- A Resend API key ([resend.com](https://resend.com))
- Optional: a Pexels API key for the auth photograph

### Turso

```bash
turso db create mfa-system
turso db show mfa-system --url
turso db tokens create mfa-system
```

Copy the URL and token into `.env.local`.

### Better Auth secret

```bash
openssl rand -base64 32
```

Use at least 32 characters. The server refuses to start without it.

---

## Setup

```bash
git clone https://github.com/aryanbatras/MFA-system.git
cd MFA-system
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```env
BETTER_AUTH_SECRET=your-generated-secret
NEXT_PUBLIC_APP_URL=http://localhost:3001
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-token
RESEND_API_KEY=re_your_key
EMAIL_FROM=MFA System <noreply@100xsystems.dev>
PEXELS_API_KEY=your-pexels-key
```

Run the migration:

```bash
npm run migrate
```

Start the app:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). The example uses port 3001 because port 3000 is often occupied by another local project. If you use port 3000, change `NEXT_PUBLIC_APP_URL` to match.

### Local email without Resend

If `RESEND_API_KEY` is empty and `NODE_ENV` is not `production`, the OTP is printed to the server console instead of being emailed. This is useful for local testing:

```text
[auth] sign-in OTP for you@example.com: 123456
```

In production, a missing `RESEND_API_KEY` is an error. The app does not silently fall back to console output.

---

## Resend sender domain

This deployment sends from:

```env
EMAIL_FROM=MFA System <noreply@100xsystems.dev>
```

`100xsystems.dev` is verified in Resend, so this sender can deliver to any valid recipient. Resend's `onboarding@resend.dev` test sender **only delivers to the email address that owns the Resend account** and should not be used for real users.

To use a different domain:

1. Add and verify the domain in the Resend dashboard, including the DNS records Resend requires.
2. Create a sender such as `MFA System <no-reply@yourdomain.com>`.
3. Set `EMAIL_FROM` in `.env.local` and in the Vercel project.
4. Redeploy.

If you test with `delivered@resend.dev`, Resend's test address, delivery succeeds but there is no inbox to read. Use the console fallback locally, or send to the Resend account owner's address.

## Recipient MX validation

`src/lib/auth/email-domain-guard.ts` runs in the Node.js auth serverless function before an OTP is created. It resolves the recipient domain's MX records:

- A usable MX record allows the send.
- No MX records fall back to A/AAAA records, as permitted by RFC 5321.
- A null MX (`0 .`) or no address records returns `EMAIL_DOMAIN_UNREACHABLE` and no email is sent.
- Transient DNS failures fail open so a resolver outage cannot block sign-in.
- Results are cached in memory for 5-10 minutes per warm serverless instance.
- The check is skipped when `RESEND_API_KEY` is empty, because local development prints the OTP to the console.

This is a deliverability guard, not a security boundary. It requires the Node.js runtime; the Edge runtime does not provide `node:dns`.

---

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Redirects to `/login` |
| `/login` | Public | Email code sign-in |
| `/signup` | Public | Email code account creation |
| `/mfa-setup` | Signed in, no MFA | QR enrollment, TOTP confirmation, recovery codes |
| `/mfa-verify` | Pending second factor | TOTP or recovery code challenge |
| `/dashboard` | Signed in with MFA | Protected account and security page |
| `/api/auth/[...all]` | Better Auth | All authentication endpoints |
| `/api/auth/token` | Signed in | Short-lived JWT from the JWT plugin |
| `/api/auth/jwks` | Public | JWKS for verifying those tokens |

---

## Database

`npm run migrate` is idempotent. It creates or updates:

| Table | Purpose |
|---|---|
| `user` | Accounts, email verification state, `twoFactorEnabled` |
| `session` | Active sessions |
| `account` | Better Auth provider accounts (no credential/password rows are created) |
| `verification` | Email OTPs, two-factor challenges, attempt counters |
| `twoFactor` | Encrypted TOTP secret, encrypted recovery codes, lockout state |
| `rateLimit` | Durable per-IP, per-path request counters |
| `jwks` | JWT signing keys |

The migration also backfills `twoFactor.verified = 1` for accounts that enabled TOTP before the `verified` column existed. This prevents the old "TOTP not enabled" failure for existing users.

The legacy `emailOtp` table from the first prototype is left in place if it already exists. It is no longer read or written; Better Auth stores OTPs in `verification`.

---

## MFA setup guide

1. Install Google Authenticator, 1Password, Authy, or any TOTP-compatible app.
2. On `/mfa-setup`, select **Set up authenticator**.
3. Scan the QR code. If the camera is unavailable, expand **Can't scan? Enter this key manually** and type the key.
4. Enter the current six-digit code from the app.
5. Save the ten recovery codes. They are shown once.

Each recovery code works once. Store the downloaded text file offline. There is no password reset flow; recovery codes are the intended recovery path.

---

## Deployment

### Vercel

```bash
vercel --prod
```

Set these environment variables in the Vercel project:

- `BETTER_AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL` (for example `https://mfa-auth-systems.vercel.app`)
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `RESEND_API_KEY`
- `EMAIL_FROM` (for example `MFA System <noreply@100xsystems.dev>`)
- `PEXELS_API_KEY`
- Optional: `TRUSTED_ORIGINS`

Run the migration once against the production database:

```bash
npm run migrate
```

`getAppUrl()` prefers the deployment's own Vercel URL when `VERCEL` is set, so a stale `NEXT_PUBLIC_APP_URL` cannot break cookie origins. Production uses `VERCEL_PROJECT_PRODUCTION_URL`; previews use `VERCEL_URL`. Set `NEXT_PUBLIC_APP_URL` correctly anyway so metadata and documentation links are accurate.

### Self-hosted

```bash
npm run build
npm start
```

Terminate TLS in front of the app. Production cookies are marked `Secure`.

---

## Verification checklist

Run through this after deploying:

1. Sign up with a new address. Confirm there is no name or password field.
2. Sign in with an address that is not in the database. Confirm no code is sent and the page says **No account exists for this email. Create an account to continue.**
3. Sign up with an address that already has an account. Confirm no code is sent and the page says **An account already exists for this email. Sign in instead.**
4. Confirm the email code arrives and the code expires after 10 minutes.
5. Confirm `/mfa-setup` shows a QR code without asking for a password.
6. Scan the QR code and confirm a TOTP code. Confirm the recovery codes are shown once.
7. Confirm `/dashboard` loads only after MFA is active.
8. Sign out. Sign in with the same address. Confirm the email code is followed by `/mfa-verify`.
9. Confirm the dashboard is not reachable by visiting it directly without a session.
10. Confirm a recovery code works once and is rejected the second time.
11. Confirm `/api/auth/token` returns a JWT for a signed-in session and rejects an anonymous request.
12. Confirm repeated OTP requests return HTTP 429 after the configured limit.

Automated checks:

```bash
npm run typecheck
npm run lint
npm run build
```

---

## Troubleshooting

### "TOTP not enabled" on `/mfa-setup`

Run `npm run migrate`. The `twoFactor` table needs `verified`, `failedVerificationCount`, and `lockedUntil`, and existing verified accounts need the backfill.

### The MFA setup page asks for a password

This build does not contain a password field. If you see one, the deployment is serving an older build. Redeploy from the current `main` branch and confirm `allowPasswordless: true` is present in `src/lib/auth.ts`.

### Email code never arrives

- Check the Resend dashboard for delivery events.
- If using `onboarding@resend.dev`, confirm the recipient is the Resend account owner.
- If the request is rejected with **That email domain cannot receive mail**, the recipient domain has no MX or A/AAAA records. Check the address for typos.
- For local development, leave `RESEND_API_KEY` empty and read the code from the server console.
- Check the `EMAIL_FROM` value. It must be a verified sender.

### Sign-in succeeds but the app returns to `/login`

Check that `NEXT_PUBLIC_APP_URL` matches the browser origin. On Vercel, the app also accepts `VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_URL`. If you use a custom domain, add it to `TRUSTED_ORIGINS`.

### HTTP 429

Rate limits are intentional. Email code requests are limited to three per minute. Second-factor verification is limited to ten per minute per client, with a five-attempt cap per challenge. Wait for the window to reset.

### Lost authenticator and recovery codes

There is no automated account recovery in this scope. An operator must remove the `twoFactor` row and set `user.twoFactorEnabled = 0`, after which the user can enroll again. This is documented as a limitation rather than hidden behind an insecure reset flow.

---

## Project structure

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              White form panel + Pexels photo panel
│   │   ├── login/
│   │   │   ├── page.tsx            Server gate + metadata
│   │   │   └── login-form.tsx
│   │   ├── signup/
│   │   │   ├── page.tsx
│   │   │   └── signup-form.tsx
│   │   ├── mfa-setup/
│   │   │   ├── page.tsx
│   │   │   └── mfa-setup-form.tsx
│   │   └── mfa-verify/
│   │       ├── page.tsx
│   │       └── mfa-verify-form.tsx
│   ├── api/auth/[...all]/route.ts  Better Auth handler
│   ├── dashboard/page.tsx          Protected account page
│   ├── globals.css                 Tailwind v4 theme
│   ├── icon.svg
│   ├── layout.tsx                  Fonts, metadata, viewport
│   └── page.tsx                    Redirect to /login
├── components/
│   ├── auth/email-code-form.tsx    Shared login/signup flow
│   ├── backup-codes.tsx
│   ├── logo.tsx
│   ├── sign-out-button.tsx
│   └── ui/                         Button, input, label, alert, OTP, copy
└── lib/
    ├── auth.ts                     Better Auth configuration
    ├── auth/email-domain-guard.ts  Recipient MX/A/AAAA validation
    ├── auth/email-otp-account-guard.ts  Login/signup account checks
    ├── auth/email-otp-two-factor.ts MFA enforcement hook
    ├── auth-client.ts
    ├── auth-errors.ts
    ├── email.ts                    Resend sender + local fallback
    ├── email/mx.ts                 MX and address-record lookup
    ├── pexels.ts                   Photo fetch + fallback
    ├── session.ts                  Server session helper
    ├── url.ts                      Vercel-aware URLs and trusted origins
    └── utils.ts
scripts/migrate.mjs                 Idempotent Turso migration
```

---

## Scope and limitations

This project deliberately covers signup, login, mandatory MFA enrollment, MFA verification, and the protected dashboard. It does not include:

- Password reset (there are no passwords)
- Passkeys or WebAuthn
- Social login
- Account deletion or email change
- A recovery-code regeneration screen
- An admin console

The JWT plugin is configured so a downstream API can verify short-lived tokens. No JWT UI is exposed in this scope.

---

## License

MIT

---

*Built with [IBM Bob](https://www.ibm.com/bob) — the AI software engineering tool that writes, reviews, and ships production code.*
