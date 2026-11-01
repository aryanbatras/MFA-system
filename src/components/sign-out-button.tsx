"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);

  async function handleSignOut() {
    setError(false);
    setLoading(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setError(true);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error ? (
        <span className="text-[12px] text-red-700" role="alert">
          Sign out failed. Try again.
        </span>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        loading={loading}
      >
        Sign out
      </Button>
    </div>
  );
}
