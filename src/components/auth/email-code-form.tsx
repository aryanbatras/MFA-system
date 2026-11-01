"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { useCountdown } from "@/lib/use-countdown";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput, isOtpComplete } from "@/components/ui/otp-input";

type Flow = "sign-in" | "sign-up";
type Step = "email" | "code";

type Copy = {
  title: string;
  description: string;
  emailLabel: string;
  emailPlaceholder: string;
  sendLabel: string;
  codeTitle: string;
  codeDescription: string;
  verifyLabel: string;
  alternatePrompt: string;
  alternateLabel: string;
  alternateHref: string;
  note: string;
  codeHelp: string;
};

const copy: Record<Flow, Copy> = {
  "sign-in": {
    title: "Sign in",
    description:
      "Enter your email. We'll send a six-digit code to verify it's you.",
    emailLabel: "Email address",
    emailPlaceholder: "you@company.com",
    sendLabel: "Send sign-in code",
    codeTitle: "Check your email",
    codeDescription: "We sent a six-digit code to",
    verifyLabel: "Verify code",
    alternatePrompt: "New to MFA System?",
    alternateLabel: "Create an account",
    alternateHref: "/signup",
    note: "Passwordless by design. We never store a password.",
    codeHelp:
      "The code expires in 10 minutes. After this step, you'll verify with your authenticator app.",
  },
  "sign-up": {
    title: "Create your account",
    description:
      "Start with your work email. We'll send a six-digit code to verify it.",
    emailLabel: "Work email",
    emailPlaceholder: "you@company.com",
    sendLabel: "Send verification code",
    codeTitle: "Verify your email",
    codeDescription: "Enter the six-digit code we sent to",
    verifyLabel: "Verify email",
    alternatePrompt: "Already have an account?",
    alternateLabel: "Sign in",
    alternateHref: "/login",
    note: "No password. No security questions. Email verification is followed by an authenticator app.",
    codeHelp:
      "The code expires in 10 minutes. Next, you'll connect an authenticator app.",
  },
};

type EmailCodeFormProps = {
  flow: Flow;
};

export function EmailCodeForm({ flow }: EmailCodeFormProps) {
  const text = copy[flow];
  const router = useRouter();
  const { seconds, start } = useCountdown(30);
  const [step, setStep] = React.useState<Step>("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [accountMissing, setAccountMissing] = React.useState(false);
  const [existingAccount, setExistingAccount] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [resent, setResent] = React.useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const complete = isOtpComplete(code);

  function applyError(cause: unknown, fallback: string) {
    const code = errorCode(cause);

    setAccountMissing(flow === "sign-in" && code === "ACCOUNT_NOT_FOUND");
    setExistingAccount(flow === "sign-up" && code === "ACCOUNT_ALREADY_EXISTS");
    setError(authErrorMessage(cause, fallback));
  }

  async function sendCode() {
    const result = await authClient.emailOtp.sendVerificationOtp(
      {
        email: normalizedEmail,
        type: "sign-in",
      },
      {
        headers: { "x-auth-flow": flow },
      },
    );

    if (result.error) {
      throw result.error;
    }
  }

  async function handleSendCode(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setAccountMissing(false);
    setExistingAccount(false);
    setResent(false);
    setLoading(true);

    try {
      await sendCode();
      setCode("");
      setStep("code");
      start(30);
    } catch (cause) {
      applyError(
        cause,
        "We could not send the code. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!complete) return;

    setError(null);
    setAccountMissing(false);
    setExistingAccount(false);
    setLoading(true);

    try {
      const result = await authClient.signIn.emailOtp(
        {
          email: normalizedEmail,
          otp: code,
        },
        {
          headers: { "x-auth-flow": flow },
        },
      );

      if (result.error) {
        applyError(
          result.error,
          "That code could not be verified. Request a new one.",
        );
        return;
      }

      const data = result.data as
        | { twoFactorRedirect?: boolean }
        | undefined;

      if (data?.twoFactorRedirect) {
        // The two-factor client plugin sends the browser to /mfa-verify.
        return;
      }

      // Every account must enroll an authenticator before reaching the app.
      router.replace("/mfa-setup");
      router.refresh();
    } catch (cause) {
      applyError(
        cause,
        "That code could not be verified. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setAccountMissing(false);
    setExistingAccount(false);
    setResent(false);
    setResending(true);

    try {
      await sendCode();
      setCode("");
      setResent(true);
      start(30);
    } catch (cause) {
      applyError(
        cause,
        "We could not resend the code. Check your connection and try again.",
      );
    } finally {
      setResending(false);
    }
  }

  function resetToEmail() {
    setStep("email");
    setCode("");
    setError(null);
    setAccountMissing(false);
    setExistingAccount(false);
    setResent(false);
  }

  function accountHint() {
    if (accountMissing) {
      return (
        <p className="text-[13px] leading-5 text-zinc-600">
          <Link
            href="/signup"
            className="font-medium text-zinc-950 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
          >
            Create an account
          </Link>{" "}
          with this email to continue.
        </p>
      );
    }

    if (existingAccount) {
      return (
        <p className="text-[13px] leading-5 text-zinc-600">
          <Link
            href="/login"
            className="font-medium text-zinc-950 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
          >
            Sign in
          </Link>{" "}
          with this email instead.
        </p>
      );
    }

    return null;
  }

  if (step === "email") {
    return (
      <div>
        <h1 className="text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-zinc-950">
          {text.title}
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-zinc-600">
          {text.description}
        </p>

        <form onSubmit={handleSendCode} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">{text.emailLabel}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={text.emailPlaceholder}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoFocus
              disabled={loading}
            />
          </div>

          {error ? <Alert>{error}</Alert> : null}
          {accountHint()}

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={!normalizedEmail}
          >
            {text.sendLabel}
          </Button>
        </form>

        <p className="mt-6 text-[14px] leading-6 text-zinc-600">
          {text.alternatePrompt}{" "}
          <Link
            href={text.alternateHref}
            className="font-medium text-zinc-950 underline underline-offset-4"
          >
            {text.alternateLabel}
          </Link>
        </p>

        <p className="mt-8 text-[12px] leading-5 text-zinc-500">{text.note}</p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={resetToEmail}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Use a different email
      </button>

      <h1 className="mt-6 text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-zinc-950">
        {text.codeTitle}
      </h1>
      <p className="mt-3 text-[15px] leading-6 text-zinc-600">
        {text.codeDescription}{" "}
        <span className="font-medium break-all text-zinc-950">
          {normalizedEmail}
        </span>
        .
      </p>

      <form onSubmit={handleVerify} className="mt-8 space-y-5">
        <div className="space-y-3">
          <Label>Verification code</Label>
          <OtpInput
            value={code}
            onChange={setCode}
            disabled={loading}
            autoFocus
            invalid={Boolean(error)}
            ariaLabel="Email verification code"
          />
          <p className="text-[12px] leading-5 text-zinc-500">
            {text.codeHelp}
          </p>
        </div>

        {error ? <Alert>{error}</Alert> : null}
        {accountHint()}

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={!complete}
        >
          {text.verifyLabel}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4">
        <span className="text-[13px] text-zinc-500">
          Didn&apos;t receive it?
        </span>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || seconds > 0}
          className="text-[13px] font-medium text-zinc-950 underline underline-offset-4 disabled:text-zinc-400 disabled:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
        >
          {seconds > 0
            ? `Resend in ${seconds}s`
            : resending
              ? "Sending..."
              : "Resend code"}
        </button>
      </div>

      {resent ? (
        <p className="mt-2 text-[13px] text-zinc-600" role="status">
          A new code is on its way.
        </p>
      ) : null}
    </div>
  );
}

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return undefined;
  }

  const value = (error as { code?: unknown }).code;
  return typeof value === "string" ? value.toUpperCase() : undefined;
}
