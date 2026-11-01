"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function MfaSetupPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"scan" | "verify">("scan");
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeMfa();
  }, []);

  async function initializeMfa() {
    try {
      const result = await authClient.twoFactor.getTotpUri({
        password: "",
      });

      if (result.error || !result.data) {
        setInitError("Could not load MFA setup. Please sign in again.");
        setInitializing(false);
        return;
      }

      const uri = result.data.totpURI;

      const QRCode = (await import("qrcode")).default;
      const qrDataUrl = await QRCode.toDataURL(uri, {
        width: 180,
        margin: 1,
        color: { dark: "#09090b", light: "#ffffff" },
      });
      setQrCode(qrDataUrl);

      const match = uri.match(/secret=([A-Z2-7]+)/i);
      if (match) setSecret(match[1]);
    } catch {
      setInitError("Could not load MFA setup. Please sign in again.");
    } finally {
      setInitializing(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: code.replace(/\s/g, ""),
      });

      if (result.error) {
        setError("Invalid code. Check your authenticator app.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Verification failed. Please try again.");
      setLoading(false);
    }
  }

  const sLabel: React.CSSProperties = { fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: "8px" };

  if (initializing) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
        <p style={{ fontSize: "14px", color: "#a1a1aa" }}>Setting up authenticator...</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div>
        <p style={{ fontSize: "14px", color: "#dc2626", marginBottom: "16px" }}>{initError}</p>
        <button
          onClick={() => router.push("/login")}
          style={{ fontSize: "14px", color: "#09090b", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  if (step === "scan") {
    return (
      <div>
        <p style={sLabel}>Step 2 of 2</p>
        <h1 style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.15, color: "#09090b", marginBottom: "8px" }}>
          Set up authenticator
        </h1>
        <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.5, marginBottom: "28px" }}>
          Open Google Authenticator and scan this QR code.
        </p>

        {qrCode && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "inline-block", border: "1px solid #e4e4e7", padding: "12px", backgroundColor: "#fff" }}>
              <img src={qrCode} alt="TOTP QR Code" width={156} height={156} style={{ display: "block" }} />
            </div>

            {secret && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontSize: "12px", color: "#a1a1aa", marginBottom: "6px" }}>
                  Or enter the key manually:
                </p>
                <code style={{
                  display: "block",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  backgroundColor: "#fafafa",
                  border: "1px solid #e4e4e7",
                  padding: "8px 12px",
                  color: "#3f3f46",
                  letterSpacing: "0.1em",
                  wordBreak: "break-all",
                }}>
                  {secret.match(/.{1,4}/g)?.join(" ") || secret}
                </code>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={() => setStep("verify")}
            style={{
              width: "100%",
              height: "42px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#fff",
              backgroundColor: "#09090b",
              border: "none",
              borderRadius: 0,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              fontFamily: "inherit",
            }}
          >
            I&apos;ve scanned the code
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              width: "100%",
              height: "42px",
              fontSize: "13px",
              fontWeight: 400,
              color: "#a1a1aa",
              backgroundColor: "transparent",
              border: "1px solid #f4f4f5",
              borderRadius: 0,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setStep("scan")}
        style={{ fontSize: "13px", color: "#a1a1aa", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: "16px" }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.15, color: "#09090b", marginBottom: "8px" }}>
        Verify code
      </h1>
      <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.5, marginBottom: "28px" }}>
        Enter the 6-digit code from your authenticator app.
      </p>

      <form onSubmit={handleVerify}>
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="code" style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#3f3f46", marginBottom: "6px" }}>
            Authentication code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            required
            disabled={loading}
            autoFocus
            style={{
              width: "100%",
              height: "52px",
              padding: "0 16px",
              fontSize: "24px",
              fontFamily: "monospace",
              color: "#09090b",
              backgroundColor: "#fff",
              border: "1px solid #e4e4e7",
              borderRadius: 0,
              outline: "none",
              boxSizing: "border-box",
              letterSpacing: "0.25em",
              textAlign: "center",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#09090b")}
            onBlur={(e) => (e.target.style.borderColor = "#e4e4e7")}
          />
        </div>

        {error && (
          <div style={{ marginBottom: "16px", padding: "10px 12px", fontSize: "13px", color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          style={{
            width: "100%",
            height: "42px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#fff",
            backgroundColor: (loading || code.length !== 6) ? "#a1a1aa" : "#09090b",
            border: "none",
            borderRadius: 0,
            cursor: (loading || code.length !== 6) ? "not-allowed" : "pointer",
            letterSpacing: "-0.01em",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {loading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              Verifying...
            </>
          ) : "Confirm and activate"}
        </button>
      </form>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
