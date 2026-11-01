"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput, isOtpComplete } from "@/components/ui/otp-input";

type Method = "totp" | "backup";

const CHALLENGE_ERRORS = new Set([
  "INVALID_TWO_FACTOR_COOKIE",
  "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE",
]);

export function MfaVerifyForm() {
  const router = useRouter();
  const [method, setMethod] = React.useState<Method>("totp");
  const [code, setCode] = React.useState("");
  const [backupCode, setBackupCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [expired, setExpired] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const normalizedBackupCode = React.useMemo(
    () => normalizeBackupCode(backupCode),
    [backupCode],
  );

  function handleChallengeError(cause: unknown): boolean {
    const value = cause as { code?: string } | null;
    const code = value?.code?.toUpperCase();

    if (code && CHALLENGE_ERRORS.has(code)) {
      setExpired(true);
      return true;
    }

    return false;
  }

  async function handleTotp(event: React.FormEvent) {
    event.preventDefault();
    if (!isOtpComplete(code)) return;

    setError(null);
    setLoading(true);

    try {
      const result = await authClient.twoFactor.verifyTotp({ code });

      if (result.error) {
        if (!handleChallengeError(result.error)) {
          setError(
            authErrorMessage(
              result.error,
              "That code did not match. Check your authenticator app and try again.",
            ),
          );
        }
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      if (!handleChallengeError(cause)) {
        setError(
          authErrorMessage(
            cause,
            "That code could not be verified. Check your connection and try again.",
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleBackupCode(event: React.FormEvent) {
    event.preventDefault();
    if (normalizedBackupCode.length < 10) return;

    setError(null);
    setLoading(true);

    try {
      const result = await authClient.twoFactor.verifyBackupCode({
        code: normalizedBackupCode,
      });

      if (result.error) {
        if (!handleChallengeError(result.error)) {
          setError(
            authErrorMessage(
              result.error,
              "That recovery code is invalid or has already been used.",
            ),
          );
        }
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      if (!handleChallengeError(cause)) {
        setError(
          authErrorMessage(
            cause,
            "That recovery code could not be verified. Check your connection and try again.",
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function switchMethod(next: Method) {
    setMethod(next);
    setError(null);
  }

  if (expired) {
    return (
      <div>
        <h1 className="text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-zinc-950">
          Verification window closed
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-zinc-600">
          For your security, sign-in challenges expire after 10 minutes. Start
          again to receive a new email code.
        </p>
        <Button asChild className="mt-8 w-full">
          <Link href="/login">Return to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-zinc-950">
        Verify your identity
      </h1>
      <p className="mt-3 text-[15px] leading-6 text-zinc-600">
        {method === "totp"
          ? "Enter the six-digit code from your authenticator app."
          : "Enter one of the recovery codes you saved when you set up two-factor authentication."}
      </p>

      {method === "totp" ? (
        <form onSubmit={handleTotp} className="mt-8 space-y-5">
          <div className="space-y-3">
            <Label>Authenticator code</Label>
            <OtpInput
              value={code}
              onChange={setCode}
              disabled={loading}
              autoFocus
              invalid={Boolean(error)}
              ariaLabel="Authenticator code"
            />
            <p className="text-[12px] leading-5 text-zinc-500">
              Codes refresh every 30 seconds.
            </p>
          </div>

          {error ? <Alert>{error}</Alert> : null}

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={!isOtpComplete(code)}
          >
            Verify code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleBackupCode} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="backup-code">Recovery code</Label>
            <Input
              id="backup-code"
              name="backup-code"
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="xxxxx-xxxxx"
              value={backupCode}
              onChange={(event) => setBackupCode(event.target.value)}
              maxLength={16}
              autoFocus
              disabled={loading}
              aria-invalid={Boolean(error) || undefined}
              className="font-mono tracking-[0.06em]"
            />
            <p className="text-[12px] leading-5 text-zinc-500">
              Recovery codes are case-sensitive and can only be used once.
            </p>
          </div>

          {error ? <Alert>{error}</Alert> : null}

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={normalizedBackupCode.length < 10}
          >
            Verify recovery code
          </Button>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-zinc-200 pt-6">
        <button
          type="button"
          onClick={() =>
            switchMethod(method === "totp" ? "backup" : "totp")
          }
          className="self-start text-[13px] font-medium text-zinc-950 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
        >
          {method === "totp"
            ? "Use a recovery code instead"
            : "Use your authenticator app instead"}
        </button>

        <Link
          href="/login"
          className="self-start text-[13px] text-zinc-500 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
        >
          Sign in with a different account
        </Link>
      </div>
    </div>
  );
}

function normalizeBackupCode(raw: string): string {
  const clean = raw.replace(/\s+/g, "").trim();

  if (/^[A-Za-z0-9]{10}$/.test(clean)) {
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  }

  return clean.slice(0, 11);
}
