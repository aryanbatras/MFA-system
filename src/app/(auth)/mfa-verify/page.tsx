import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { MfaVerifyForm } from "./mfa-verify-form";

export const metadata: Metadata = {
  title: "Verify your identity",
  description: "Complete two-factor authentication to access your account.",
};

const TWO_FACTOR_COOKIES = [
  "better-auth.two_factor",
  "__Secure-better-auth.two_factor",
];

export default async function MfaVerifyPage() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const hasChallenge = TWO_FACTOR_COOKIES.some((name) =>
    cookieStore.has(name),
  );

  if (!hasChallenge) {
    return <ExpiredChallenge />;
  }

  return <MfaVerifyForm />;
}

function ExpiredChallenge() {
  return (
    <div>
      <h1 className="text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-zinc-950">
        Verification window closed
      </h1>
      <p className="mt-3 text-[15px] leading-6 text-zinc-600">
        For your security, sign-in challenges expire after 10 minutes. Start
        again to receive a new email code.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex h-12 w-full items-center justify-center bg-zinc-950 px-6 text-[14px] font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
      >
        Return to sign in
      </Link>
    </div>
  );
}
