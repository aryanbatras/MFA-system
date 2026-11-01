"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OtpInput, isOtpComplete } from "@/components/ui/otp-input";
import { CopyButton } from "@/components/ui/copy-button";
import { BackupCodes } from "@/components/backup-codes";

type Stage = "intro" | "scan" | "done" | "already";

type EnableResponse = {
  method?: "totp" | "otp";
  totpURI?: string;
  backupCodes?: string[];
};

type MfaSetupFormProps = {
  alreadyEnabled: boolean;
};

export function MfaSetupForm({ alreadyEnabled }: MfaSetupFormProps) {
  const router = useRouter();
  const [stage, setStage] = React.useState<Stage>(
    alreadyEnabled ? "already" : "intro",
  );
  const [qrSvg, setQrSvg] = React.useState<string | null>(null);
  const [secret, setSecret] = React.useState<string | null>(null);
  const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);

  async function handleEnable() {
    setError(null);
    setSessionExpired(false);
    setCode("");
    setLoading(true);

    try {
      const result = await authClient.twoFactor.enable({ method: "totp" });

      if (result.error) {
        if (result.error.code === "TOTP_ALREADY_ENABLED") {
          setStage("already");
          return;
        }

        if (
          result.error.code === "UNAUTHORIZED" ||
          result.error.code === "SESSION_EXPIRED"
        ) {
          setSessionExpired(true);
          return;
        }

        setError(
          authErrorMessage(
            result.error,
            "We could not start authenticator setup. Try again.",
          ),
        );
        return;
      }

      const data = result.data as EnableResponse | undefined;
      const uri = data?.totpURI;

      if (!uri) {
        setError("The authenticator key was not returned. Try again.");
        return;
      }

      const QRCode = (await import("qrcode")).default;
      const svg = await QRCode.toString(uri, {
        type: "svg",
        width: 220,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#0a0a0a", light: "#ffffff" },
      });

      const parsedSecret = readTotpSecret(uri);

      setQrSvg(svg);
      setSecret(parsedSecret);
      setBackupCodes(data?.backupCodes ?? []);
      setStage("scan");
    } catch (error) {
      setError(
        authErrorMessage(
          error,
          "We could not start authenticator setup. Check your connection and try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!isOtpComplete(code)) return;

    setError(null);
    setVerifying(true);

    try {
      const result = await authClient.twoFactor.verifyTotp({ code });

      if (result.error) {
        if (
          result.error.code === "UNAUTHORIZED" ||
          result.error.code === "SESSION_EXPIRED"
        ) {
          setSessionExpired(true);
          return;
        }

        setError(
          authErrorMessage(
            result.error,
            "That code did not match. Check your authenticator app and try again.",
          ),
        );
        return;
      }

      setStage("done");
    } catch (error) {
      setError(
        authErrorMessage(
          error,
          "That code could not be verified. Check your connection and try again.",
        ),
      );
    } finally {
      setVerifying(false);
    }
  }

  function handleStartOver() {
    setStage("intro");
    setQrSvg(null);
    setSecret(null);
    setBackupCodes([]);
    setCode("");
    setError(null);
  }

  function goToDashboard() {
    router.replace("/dashboard");
    router.refresh();
  }

  if (sessionExpired) {
    return (
      <div>
        <h1 className="text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-zinc-950">
          Session expired
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-zinc-600">
          Sign in again to continue securing your account.
        </p>
        <Button asChild className="mt-8 w-full">
          <Link href="/login">Return to sign in</Link>
        </Button>
      </div>
    );
  }

  if (stage === "already") {
    return (
      <div>
        <h1 className="text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-zinc-950">
          Two-factor is active
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-zinc-600">
          This account already has an authenticator app. You&apos;ll be asked
          for a code the next time you sign in.
        </p>
        <Button className="mt-8 w-full" onClick={goToDashboard}>
          Go to dashboard
        </Button>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div>
        <h1 className="text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-zinc-950">
          Two-factor is active
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-zinc-600">
          Your account is now protected by your authenticator app. Keep the
          recovery codes somewhere safe.
        </p>

        {backupCodes.length > 0 ? (
          <div className="mt-8">
            <BackupCodes codes={backupCodes} />
            <p className="mt-3 text-[12px] leading-5 text-zinc-500">
              These codes are shown once. Store them offline before you
              continue.
            </p>
          </div>
        ) : (
          <div className="mt-8 bg-zinc-50 p-4 text-[13px] leading-5 text-zinc-600">
            Recovery codes were not returned. Sign in again and restart setup
            to generate a new set.
          </div>
        )}

        <Button className="mt-6 w-full" onClick={goToDashboard}>
          Continue to dashboard
        </Button>
      </div>
    );
  }

  if (stage === "scan") {
    return (
      <div>
        <h1 className="text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-zinc-950">
          Scan this code
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-zinc-600">
          Open your authenticator app and add a new account.
        </p>

        {qrSvg ? (
          <div
            className="mt-8 flex justify-center bg-white p-2"
            role="img"
            aria-label="QR code for your authenticator app"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        ) : null}

        {secret ? (
          <details className="mt-4">
            <summary className="cursor-pointer text-[13px] font-medium text-zinc-700">
              Can&apos;t scan? Enter this key manually
            </summary>
            <div className="mt-3 bg-zinc-50 p-4 font-mono text-[13px] leading-6 tracking-[0.08em] text-zinc-800 break-all">
              {formatSecret(secret)}
            </div>
            <CopyButton value={secret} label="Copy key" className="mt-2" />
          </details>
        ) : null}

        <form onSubmit={handleVerify} className="mt-8 space-y-5">
          <div className="space-y-3">
            <Label>Authenticator code</Label>
            <OtpInput
              value={code}
              onChange={setCode}
              disabled={verifying}
              autoFocus
              invalid={Boolean(error)}
              ariaLabel="Authenticator code"
            />
            <p className="text-[12px] leading-5 text-zinc-500">
              Enter the six-digit code shown in your app to confirm setup.
            </p>
          </div>

          {error ? <Alert>{error}</Alert> : null}

          <Button
            type="submit"
            className="w-full"
            loading={verifying}
            disabled={!isOtpComplete(code)}
          >
            Activate two-factor
          </Button>
        </form>

        <button
          type="button"
          onClick={handleStartOver}
          className="mt-4 inline-flex text-[13px] font-medium text-zinc-500 transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
        >
          Start over
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-zinc-950">
        Secure your account
      </h1>
      <p className="mt-3 text-[15px] leading-6 text-zinc-600">
        Add an authenticator app. You&apos;ll use a six-digit code from it every
        time you sign in.
      </p>

      <div className="mt-8 bg-zinc-50 p-5">
        <p className="text-[14px] font-medium text-zinc-950">
          Before you start
        </p>
        <p className="mt-2 text-[13px] leading-5 text-zinc-600">
          Install Google Authenticator, 1Password, Authy, or any
          TOTP-compatible app. You&apos;ll scan a QR code and confirm one
          six-digit code.
        </p>
      </div>

      {error ? (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <Button
        className="mt-6 w-full"
        onClick={handleEnable}
        loading={loading}
      >
        Set up authenticator
      </Button>

      <p className="mt-4 text-[12px] leading-5 text-zinc-500">
        Recovery codes will be generated. Store them somewhere safe before you
        continue.
      </p>
    </div>
  );
}

function readTotpSecret(uri: string): string | null {
  try {
    return new URL(uri).searchParams.get("secret");
  } catch {
    const match = uri.match(/[?&]secret=([^&]+)/i);
    return match ? decodeURIComponent(match[1]) : null;
  }
}

function formatSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret;
}
