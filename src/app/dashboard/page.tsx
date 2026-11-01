"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[14px] text-zinc-400">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : session.user.email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <header className="border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 h-14 flex items-center justify-between">
          <span className="text-[13px] font-semibold tracking-[0.08em] uppercase text-zinc-400 select-none">
            MFA System
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center">
                <span className="text-[11px] font-semibold text-white">{initials}</span>
              </div>
              <span className="text-[13px] text-zinc-600 hidden sm:block">
                {session.user.email}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-16">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-2">
            Authenticated
          </p>
          <h1 className="text-[40px] font-semibold tracking-[-0.03em] text-zinc-900 leading-[1.1] mb-4">
            Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}.
          </h1>
          <p className="text-[16px] text-zinc-500 leading-relaxed">
            Your session is active and secured with two-factor authentication.
          </p>
        </div>

        {/* Status cards */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-0 border border-zinc-100">
          <div className="px-6 py-6 border-b sm:border-b-0 sm:border-r border-zinc-100">
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-1">
              Session
            </p>
            <p className="text-[15px] font-medium text-zinc-900">Active</p>
            <p className="text-[12px] text-zinc-400 mt-0.5">Authenticated via email</p>
          </div>
          <div className="px-6 py-6 border-b sm:border-b-0 sm:border-r border-zinc-100">
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-1">
              MFA Status
            </p>
            <p className="text-[15px] font-medium text-zinc-900">Enabled</p>
            <p className="text-[12px] text-zinc-400 mt-0.5">TOTP via authenticator</p>
          </div>
          <div className="px-6 py-6">
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-1">
              Account
            </p>
            <p className="text-[15px] font-medium text-zinc-900 truncate">{session.user.email}</p>
            <p className="text-[12px] text-zinc-400 mt-0.5">Verified</p>
          </div>
        </div>

        {/* MFA manage section */}
        <div className="mt-10 pt-10 border-t border-zinc-100">
          <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-zinc-900 mb-2">
            Security settings
          </h2>
          <p className="text-[14px] text-zinc-500 mb-5">
            Manage your two-factor authentication settings.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/mfa-setup")}
          >
            Reconfigure authenticator
          </Button>
        </div>
      </main>
    </div>
  );
}
