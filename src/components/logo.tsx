import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.02em] text-zinc-950",
        className,
      )}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="1.25"
          y="1.25"
          width="10.5"
          height="10.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect
          x="8.25"
          y="8.25"
          width="10.5"
          height="10.5"
          fill="white"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      MFA System
    </span>
  );
}
