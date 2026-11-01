"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const inputS: React.CSSProperties = {
  width: "100%", height: "42px", padding: "0 12px", fontSize: "14px",
  color: "#09090b", backgroundColor: "#fff", border: "1px solid #e4e4e7",
  borderRadius: 0, outline: "none", boxSizing: "border-box",
  letterSpacing: "-0.01em", fontFamily: "inherit",
};
const btnS = (disabled: boolean): React.CSSProperties => ({
  width: "100%", height: "42px", fontSize: "14px", fontWeight: 500,
  color: "#fff", backgroundColor: disabled ? "#a1a1aa" : "#09090b",
  border: "none", borderRadius: 0, cursor: disabled ? "not-allowed" : "pointer",
  letterSpacing: "-0.01em", fontFamily: "inherit",
  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
});

const Spinner = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  // email → check account exists
  // otp   → enter the email OTP code (first factor)
  //         if TOTP is enabled, Better Auth auto-redirects to /mfa-verify (second factor)
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Step 1: Check account exists, then send OTP
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Check account exists first
      const res = await fetch("/api/user/exists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const { exists } = await res.json();

      if (!exists) {
        setError("No account found for this email. Please sign up first.");
        setLoading(false);
        return;
      }

      // Account exists — send OTP
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "sign-in",
      });

      if (result.error) {
        setError(result.error.message || "Failed to send code. Try again.");
        setLoading(false);
        return;
      }

      setStep("otp");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP — if TOTP is enabled, twoFactorClient redirects to /mfa-verify automatically
  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp: otp.trim(),
        // twoFactorClient plugin intercepts here and redirects to /mfa-verify if TOTP enabled
        fetchOptions: {
          onSuccess: () => {
            router.push("/dashboard");
            router.refresh();
          },
        },
      });

      if (result?.error) {
        setError(result.error.message || "Invalid or expired code.");
        setLoading(false);
      }
    } catch {
      setError("Verification failed. Please try again.");
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    try {
      await authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: "sign-in" });
    } catch {
      setError("Could not resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  if (step === "email") {
    return (
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.15, color: "#09090b", marginBottom: "8px" }}>
          Sign in
        </h1>
        <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.5, marginBottom: "28px" }}>
          Enter your email to continue.
        </p>

        <form onSubmit={handleEmailSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="email" style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#3f3f46", marginBottom: "6px" }}>
              Email address
            </label>
            <input
              id="email" type="email" autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required autoFocus disabled={loading}
              style={inputS}
              onFocus={(e) => (e.target.style.borderColor = "#09090b")}
              onBlur={(e) => (e.target.style.borderColor = "#e4e4e7")}
            />
          </div>

          {error && (
            <div style={{ marginBottom: "16px", padding: "10px 12px", fontSize: "13px", color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !email} style={btnS(loading || !email)}>
            {loading ? <><Spinner /> Checking...</> : "Continue"}
          </button>
        </form>

        <div style={{ margin: "20px 0", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#f4f4f5" }} />
          <span style={{ fontSize: "11px", color: "#a1a1aa", letterSpacing: "0.06em", textTransform: "uppercase" }}>or</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#f4f4f5" }} />
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#71717a" }}>
          No account?{" "}
          <Link href="/signup" style={{ color: "#09090b", fontWeight: 500, textDecoration: "underline", textUnderlineOffset: "3px" }}>
            Create one
          </Link>
        </p>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // OTP entry step
  return (
    <div>
      <button
        onClick={() => { setStep("email"); setOtp(""); setError(null); }}
        style={{ fontSize: "13px", color: "#a1a1aa", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: "20px" }}
      >
        ← Change email
      </button>

      <h1 style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.15, color: "#09090b", marginBottom: "8px" }}>
        Check your email
      </h1>
      <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.5, marginBottom: "6px" }}>
        We sent a sign-in code to
      </p>
      <p style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", marginBottom: "28px" }}>
        {email}
      </p>

      <form onSubmit={handleOtpSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="otp" style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#3f3f46", marginBottom: "6px" }}>
            Verification code
          </label>
          <input
            id="otp" type="text" inputMode="numeric" autoComplete="one-time-code"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6} required autoFocus disabled={loading}
            style={{ ...inputS, height: "56px", fontSize: "28px", fontFamily: "monospace", letterSpacing: "0.25em", textAlign: "center" }}
            onFocus={(e) => (e.target.style.borderColor = "#09090b")}
            onBlur={(e) => (e.target.style.borderColor = "#e4e4e7")}
          />
          <p style={{ marginTop: "6px", fontSize: "12px", color: "#a1a1aa" }}>
            Code expires in 10 minutes. After verifying, you&apos;ll be asked for your authenticator code.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: "16px", padding: "10px 12px", fontSize: "13px", color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading || otp.length !== 6} style={btnS(loading || otp.length !== 6)}>
          {loading ? <><Spinner /> Verifying...</> : "Verify code"}
        </button>
      </form>

      <p style={{ marginTop: "16px", textAlign: "center", fontSize: "13px", color: "#71717a" }}>
        Didn&apos;t receive it?{" "}
        <button onClick={handleResend} disabled={resending}
          style={{ color: "#09090b", fontWeight: 500, textDecoration: "underline", textUnderlineOffset: "3px", background: "none", border: "none", cursor: resending ? "not-allowed" : "pointer", fontSize: "13px", fontFamily: "inherit", padding: 0 }}>
          {resending ? "Sending..." : "Resend code"}
        </button>
      </p>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
