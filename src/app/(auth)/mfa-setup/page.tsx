"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MfaSetupPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"setup" | "verify">("setup");
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    initializeMfa();
  }, []);

  async function initializeMfa() {
    try {
      const result = await authClient.twoFactor.getTotpUri({
        password: "", // Better auth handles session
      });

      if (result.data) {
        setTotpUri(result.data.totpURI);

        // Generate QR code as data URL
        const QRCode = (await import("qrcode")).default;
        const qrDataUrl = await QRCode.toDataURL(result.data.totpURI, {
          width: 200,
          margin: 2,
          color: {
            dark: "#18181b",
            light: "#ffffff",
          },
        });
        setQrCode(qrDataUrl);

        // Extract secret from URI
        const match = result.data.totpURI.match(/secret=([A-Z2-7]+)/i);
        if (match) setSecret(match[1]);
      }
    } catch (err) {
      // If no active session, redirect to login
      router.push("/login");
    } finally {
      setInitializing(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: code.replace(/\s/g, ""),
      });

      if (result.error) {
        setError("Invalid code. Please check your authenticator app and try again.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Verification failed. Please try again.");
      setLoading(false);
    }
  }

  async function handleSkip() {
    router.push("/dashboard");
  }

  if (initializing) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="text-[14px] text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {step === "setup" ? (
        <>
          <div className="mb-8">
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-2">
              Step 2 of 2
            </p>
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-zinc-900 leading-[1.1]">
              Set up authenticator
            </h1>
            <p className="mt-2 text-[15px] text-zinc-500">
              Scan the QR code with Google Authenticator or any TOTP app.
            </p>
          </div>

          {qrCode && (
            <div className="mb-8">
              <div className="inline-block border border-zinc-200 p-4 bg-white">
                <img src={qrCode} alt="TOTP QR Code" width={160} height={160} />
              </div>

              {secret && (
                <div className="mt-4">
                  <p className="text-[12px] text-zinc-500 mb-1.5">
                    Or enter the setup key manually:
                  </p>
                  <code className="block font-mono text-[13px] bg-zinc-50 border border-zinc-200 px-3 py-2 text-zinc-700 tracking-[0.1em] break-all">
                    {secret.match(/.{1,4}/g)?.join(" ") || secret}
                  </code>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={() => setStep("verify")}
            >
              I&apos;ve scanned the QR code
            </Button>
            <Button
              variant="ghost"
              className="w-full text-zinc-400 text-[13px]"
              onClick={handleSkip}
            >
              Skip for now
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-8">
            <button
              onClick={() => setStep("setup")}
              className="text-[13px] text-zinc-400 mb-4 flex items-center gap-1"
            >
              &larr; Back
            </button>
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-zinc-900 leading-[1.1]">
              Verify setup
            </h1>
            <p className="mt-2 text-[15px] text-zinc-500">
              Enter the 6-digit code from your authenticator app to confirm setup.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
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
                className="tracking-[0.2em] text-center text-[20px] font-mono"
              />
            </div>

            {error && (
              <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 px-3 py-2.5">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              size="lg"
            >
              Confirm and activate
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
