"use client";

import { Download } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";

type BackupCodesProps = {
  codes: string[];
};

export function BackupCodes({ codes }: BackupCodesProps) {
  function download() {
    const generated = new Date().toISOString();
    const body = [
      "MFA System — recovery codes",
      `Generated: ${generated}`,
      "",
      "Each code can be used once if you lose access to your authenticator app.",
      "Store this file somewhere safe and offline.",
      "",
      ...codes,
      "",
    ].join("\n");

    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mfa-system-recovery-codes.txt";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-zinc-600">
          Store these somewhere safe. Each code works once.
        </p>
        <div className="flex items-center gap-2">
          <CopyButton value={codes.join("\n")} label="Copy all" />
          <button
            type="button"
            onClick={download}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-none border border-zinc-300 bg-white px-3 text-[13px] font-medium text-zinc-800 transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 bg-zinc-50 p-4 font-mono text-[13px] tabular-nums text-zinc-800">
        {codes.map((code) => (
          <span key={code} className="select-all">
            {code}
          </span>
        ))}
      </div>
    </div>
  );
}
