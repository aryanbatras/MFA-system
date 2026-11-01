"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        setError(result.error.message || "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      // If MFA is required, better-auth redirects to twoFactorPage automatically
      // Otherwise push to dashboard
      if (!result.error) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-zinc-900 leading-[1.1]">
          Sign in
        </h1>
        <p className="mt-2 text-[15px] text-zinc-500">
          Enter your credentials to access your account.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {error && (
          <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 px-3 py-2.5">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full mt-2"
          loading={loading}
          size="lg"
        >
          Sign in
        </Button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-100" />
        <span className="text-[12px] text-zinc-400 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-zinc-100" />
      </div>

      {/* Sign up link */}
      <p className="text-center text-[14px] text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-zinc-900 font-medium underline underline-offset-2"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
