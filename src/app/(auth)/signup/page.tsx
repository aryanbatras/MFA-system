import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create a passwordless MFA System account with email verification and an authenticator app.",
};

export default async function SignupPage() {
  const session = await getServerSession();

  if (session) {
    redirect(session.user.twoFactorEnabled ? "/dashboard" : "/mfa-setup");
  }

  return <SignupForm />;
}
