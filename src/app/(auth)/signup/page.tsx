"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const inputStyle = (disabled: boolean): React.CSSProperties => ({
  width: "100%",
  height: "42px",
  padding: "0 12px",
  fontSize: "14px",
  color: "#09090b",
  backgroundColor: disabled ? "#fafafa" : "#fff",
  border: "1px solid #e4e4e7",
  borderRadius: 0,
  outline: "none",
  boxSizing: "border-box",
  letterSpacing: "-0.01em",
  fontFamily: "inherit",
});

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 500,
  color: "#3f3f46",
  marginBottom: "6px",
  letterSpacing: "-0.01em",
};

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
        callbackURL: "/mfa-setup",
      });

      if (result.error) {
        setError(result.error.message || "Registration failed.");
        setLoading(false);
        return;
      }

      router.push("/mfa-setup");
    } catch {
      setError("Unable to connect. Please try again.");
      setLoading(false);
    }
  }

  const fields = [
    { id: "name", label: "Full name", type: "text", placeholder: "Jane Smith", value: name, onChange: setName, autoComplete: "name" },
    { id: "email", label: "Email address", type: "email", placeholder: "you@company.com", value: email, onChange: setEmail, autoComplete: "email" },
    { id: "password", label: "Password", type: "password", placeholder: "Minimum 8 characters", value: password, onChange: setPassword, autoComplete: "new-password" },
    { id: "confirm", label: "Confirm password", type: "password", placeholder: "••••••••", value: confirm, onChange: setConfirm, autoComplete: "new-password" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: "8px" }}>
          Step 1 of 2
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.15, color: "#09090b", marginBottom: "8px" }}>
          Create account
        </h1>
        <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.5 }}>
          Set up your account with two-factor authentication.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: "24px" }}>
        {fields.map((f) => (
          <div key={f.id} style={{ marginBottom: "14px" }}>
            <label htmlFor={f.id} style={labelStyle}>{f.label}</label>
            <input
              id={f.id}
              type={f.type}
              autoComplete={f.autoComplete}
              placeholder={f.placeholder}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              required
              disabled={loading}
              style={inputStyle(loading)}
              onFocus={(e) => (e.target.style.borderColor = "#09090b")}
              onBlur={(e) => (e.target.style.borderColor = "#e4e4e7")}
            />
          </div>
        ))}

        {error && (
          <div style={{ marginBottom: "14px", padding: "10px 12px", fontSize: "13px", color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            height: "42px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#fff",
            backgroundColor: loading ? "#52525b" : "#09090b",
            border: "none",
            borderRadius: 0,
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "-0.01em",
            marginTop: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontFamily: "inherit",
          }}
        >
          {loading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              Creating account...
            </>
          ) : "Create account"}
        </button>
      </form>

      <p style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "#71717a" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#09090b", fontWeight: 500, textDecoration: "underline", textUnderlineOffset: "3px" }}>
          Sign in
        </Link>
      </p>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
