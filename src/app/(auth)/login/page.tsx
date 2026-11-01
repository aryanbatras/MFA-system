"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        setError(
          result.error.message === "Invalid email or password"
            ? "Incorrect email or password."
            : result.error.message || "Sign in failed."
        );
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            color: "#09090b",
            marginBottom: "8px",
          }}
        >
          Sign in
        </h1>
        <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.5 }}>
          Enter your credentials to continue.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="email"
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "#3f3f46",
              marginBottom: "6px",
              letterSpacing: "-0.01em",
            }}
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={{
              width: "100%",
              height: "42px",
              padding: "0 12px",
              fontSize: "14px",
              color: "#09090b",
              backgroundColor: loading ? "#fafafa" : "#fff",
              border: "1px solid #e4e4e7",
              borderRadius: "0",
              outline: "none",
              boxSizing: "border-box",
              letterSpacing: "-0.01em",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#09090b")}
            onBlur={(e) => (e.target.style.borderColor = "#e4e4e7")}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="password"
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "#3f3f46",
              marginBottom: "6px",
              letterSpacing: "-0.01em",
            }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{
              width: "100%",
              height: "42px",
              padding: "0 12px",
              fontSize: "14px",
              color: "#09090b",
              backgroundColor: loading ? "#fafafa" : "#fff",
              border: "1px solid #e4e4e7",
              borderRadius: "0",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#09090b")}
            onBlur={(e) => (e.target.style.borderColor = "#e4e4e7")}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "10px 12px",
              fontSize: "13px",
              color: "#dc2626",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              letterSpacing: "-0.01em",
            }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            height: "42px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#ffffff",
            backgroundColor: loading ? "#52525b" : "#09090b",
            border: "none",
            borderRadius: "0",
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "background-color 150ms",
          }}
        >
          {loading ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      {/* Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          margin: "20px 0",
        }}
      >
        <div style={{ flex: 1, height: "1px", backgroundColor: "#f4f4f5" }} />
        <span style={{ fontSize: "11px", color: "#a1a1aa", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          or
        </span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#f4f4f5" }} />
      </div>

      {/* Sign up link */}
      <p style={{ textAlign: "center", fontSize: "13px", color: "#71717a" }}>
        No account?{" "}
        <Link
          href="/signup"
          style={{ color: "#09090b", fontWeight: 500, textDecoration: "underline", textUnderlineOffset: "3px" }}
        >
          Create one
        </Link>
      </p>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
