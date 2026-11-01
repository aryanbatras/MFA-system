"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function MfaVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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
      router.refresh();
    } catch {
      setError("Verification failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: "8px" }}>
        Two-factor authentication
      </p>
      <h1 style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.15, color: "#09090b", marginBottom: "8px" }}>
        Verify identity
      </h1>
      <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.5, marginBottom: "28px" }}>
        Open your authenticator app and enter the 6-digit code.
      </p>

      <form onSubmit={handleSubmit}>
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
          <p style={{ marginTop: "6px", fontSize: "12px", color: "#a1a1aa" }}>
            Code refreshes every 30 seconds.
          </p>
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
          ) : "Verify"}
        </button>
      </form>

      <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #f4f4f5" }}>
        <p style={{ fontSize: "13px", color: "#a1a1aa" }}>
          Lost access to your authenticator?{" "}
          <a href="mailto:support@mfasystem.io" style={{ color: "#3f3f46", textDecoration: "underline", textUnderlineOffset: "3px" }}>
            Contact support
          </a>
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
