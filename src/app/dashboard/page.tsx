import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = {
  title: "Account security",
  description: "Your MFA System account and security status.",
};

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.user.twoFactorEnabled) {
    redirect("/mfa-setup");
  }

  const startedAt = formatDate(session.session.createdAt);
  const expiresAt = formatDate(session.session.expiresAt);

  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between gap-6 px-6">
          <Logo />
          <div className="flex items-center gap-5">
            <span className="hidden max-w-[260px] truncate text-[13px] text-zinc-600 sm:block">
              {session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-14 sm:pt-20">
        <div className="max-w-2xl">
          <h1 className="text-balance text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] text-zinc-950">
            Account security
          </h1>
          <p className="mt-4 text-[16px] leading-7 text-zinc-600">
            You are signed in with an email code and an authenticator app. Both
            factors are required for every new session.
          </p>
        </div>

        <section className="mt-14 border-t border-zinc-200 pt-10">
          <h2 className="text-[20px] font-semibold tracking-[-0.025em] text-zinc-950">
            Identity
          </h2>
          <dl className="mt-6 grid gap-px border border-zinc-200 bg-zinc-200 sm:grid-cols-2">
            <div className="bg-white p-6">
              <dt className="text-[12px] text-zinc-500">Email address</dt>
              <dd className="mt-2 break-all text-[15px] font-medium text-zinc-950">
                {session.user.email}
              </dd>
            </div>
            <div className="bg-white p-6">
              <dt className="text-[12px] text-zinc-500">Email verification</dt>
              <dd className="mt-2 text-[15px] font-medium text-zinc-950">
                Verified
              </dd>
            </div>
            <div className="bg-white p-6">
              <dt className="text-[12px] text-zinc-500">First factor</dt>
              <dd className="mt-2 text-[15px] font-medium text-zinc-950">
                Email one-time code
              </dd>
            </div>
            <div className="bg-white p-6">
              <dt className="text-[12px] text-zinc-500">Second factor</dt>
              <dd className="mt-2 text-[15px] font-medium text-zinc-950">
                Authenticator app (TOTP)
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-12 border-t border-zinc-200 pt-10">
          <h2 className="text-[20px] font-semibold tracking-[-0.025em] text-zinc-950">
            Recovery
          </h2>
          <div className="mt-6 border border-zinc-200 p-6">
            <p className="text-[15px] font-medium text-zinc-950">
              Single-use recovery codes
            </p>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-zinc-600">
              Ten recovery codes were generated when you activated two-factor
              authentication. Each code works once. Keep the file offline; it is
              the only way back in if you lose your authenticator app.
            </p>
          </div>
        </section>

        <section className="mt-12 border-t border-zinc-200 pt-10">
          <h2 className="text-[20px] font-semibold tracking-[-0.025em] text-zinc-950">
            Current session
          </h2>
          <dl className="mt-6 divide-y divide-zinc-200 border border-zinc-200">
            <div className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
              <dt className="text-[13px] text-zinc-500">Status</dt>
              <dd className="text-[14px] font-medium text-zinc-950">Active</dd>
            </div>
            <div className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
              <dt className="text-[13px] text-zinc-500">Started</dt>
              <dd className="text-[14px] font-medium text-zinc-950">
                {startedAt}
              </dd>
            </div>
            <div className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
              <dt className="text-[13px] text-zinc-500">Expires</dt>
              <dd className="text-[14px] font-medium text-zinc-950">
                {expiresAt}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-[12px] leading-5 text-zinc-500">
            Sessions are stored in HTTP-only cookies and expire automatically
            after seven days.
          </p>
        </section>

        <footer className="mt-16 border-t border-zinc-200 pt-6">
          <p className="text-[12px] text-zinc-500">Built with IBM Bob</p>
        </footer>
      </main>
    </div>
  );
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date)} UTC`;
}
