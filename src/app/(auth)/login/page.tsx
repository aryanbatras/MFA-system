import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to MFA System with a passwordless email code.",
};

export default async function LoginPage() {
  const session = await getServerSession();

  if (session) {
    redirect(session.user.twoFactorEnabled ? "/dashboard" : "/mfa-setup");
  }

  return <LoginForm />;
}
