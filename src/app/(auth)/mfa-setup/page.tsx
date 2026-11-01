import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { MfaSetupForm } from "./mfa-setup-form";

export const metadata: Metadata = {
  title: "Set up two-factor authentication",
  description:
    "Connect an authenticator app to protect your MFA System account.",
};

export default async function MfaSetupPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <MfaSetupForm alreadyEnabled={Boolean(session.user.twoFactorEnabled)} />
  );
}
