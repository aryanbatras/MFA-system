"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push("/login"),
      },
    });
  }

  if (isPending) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <p style={{ fontSize: "14px", color: "#a1a1aa" }}>Loading...</p>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const initials = session.user.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : session.user.email.slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      {/* Nav */}
      <header style={{ borderBottom: "1px solid #f4f4f5" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a1a1aa" }}>
            MFA System
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#fff" }}>{initials}</span>
              </div>
              <span style={{ fontSize: "13px", color: "#71717a" }}>{session.user.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              style={{
                height: "32px",
                padding: "0 14px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#3f3f46",
                backgroundColor: "#fff",
                border: "1px solid #e4e4e7",
                borderRadius: 0,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "-0.01em",
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "64px 24px" }}>
        {/* Hero */}
        <div style={{ maxWidth: "560px", marginBottom: "56px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: "12px" }}>
            Authenticated
          </p>
          <h1 style={{ fontSize: "36px", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, color: "#09090b", marginBottom: "16px" }}>
            Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}.
          </h1>
          <p style={{ fontSize: "15px", color: "#71717a", lineHeight: 1.6 }}>
            Your session is active and protected by two-factor authentication.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid #f4f4f5", marginBottom: "48px" }}>
          {[
            { label: "Session", value: "Active", sub: "Email authenticated" },
            { label: "MFA Status", value: "Enabled", sub: "TOTP authenticator" },
            { label: "Account", value: session.user.email, sub: "Verified", truncate: true },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: "20px 24px",
                borderRight: i < 2 ? "1px solid #f4f4f5" : undefined,
              }}
            >
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: "6px" }}>
                {item.label}
              </p>
              <p style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#09090b",
                overflow: item.truncate ? "hidden" : undefined,
                textOverflow: item.truncate ? "ellipsis" : undefined,
                whiteSpace: item.truncate ? "nowrap" : undefined,
              }}>
                {item.value}
              </p>
              <p style={{ fontSize: "12px", color: "#a1a1aa", marginTop: "2px" }}>{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Security */}
        <div style={{ paddingTop: "36px", borderTop: "1px solid #f4f4f5" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, letterSpacing: "-0.02em", color: "#09090b", marginBottom: "6px" }}>
            Security settings
          </h2>
          <p style={{ fontSize: "14px", color: "#71717a", marginBottom: "20px" }}>
            Reconfigure your two-factor authentication method.
          </p>
          <button
            onClick={() => router.push("/mfa-setup")}
            style={{
              height: "38px",
              padding: "0 18px",
              fontSize: "13px",
              fontWeight: 500,
              color: "#3f3f46",
              backgroundColor: "#fff",
              border: "1px solid #e4e4e7",
              borderRadius: 0,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "-0.01em",
            }}
          >
            Reconfigure authenticator
          </button>
        </div>
      </main>
    </div>
  );
}
