"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MfaVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: code.replace(/\s/g, ""),
      });

      if (result.error) {
        setError("Invalid code. Check your authenticator app and try again.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Verification failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-2">
          Two-factor authentication
        </p>
        <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-zinc-900 leading-[1.1]">
          Verify identity
        </h1>
        <p className="mt-2 text-[15px] text-zinc-500">
          Open your authenticator app and enter the 6-digit code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="code">Authentication code</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000 000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
            maxLength={6}
            required
            disabled={loading}
            autoFocus
            className="tracking-[0.2em] text-center text-[20px] font-mono"
          />
          <p className="text-[12px] text-zinc-400">
            Code refreshes every 30 seconds.
          </p>
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
          disabled={code.length !== 6}
        >
          Verify
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-zinc-100">
        <p className="text-[13px] text-zinc-500">
          Lost access to your authenticator?{" "}
          <a href="mailto:support@mfasystem.io" className="text-zinc-900 underline underline-offset-2">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
