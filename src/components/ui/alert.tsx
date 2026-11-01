import * as React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "error" | "success" | "info";

const styles: Record<AlertVariant, string> = {
  error: "bg-red-50 text-red-900",
  success: "bg-emerald-50 text-emerald-950",
  info: "bg-zinc-100 text-zinc-900",
};

const icons: Record<AlertVariant, React.ComponentType<{ className?: string }>> =
  {
    error: AlertCircle,
    success: CheckCircle2,
    info: Info,
  };

export function Alert({
  variant = "error",
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  const Icon = icons[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "flex items-start gap-2.5 p-3.5 text-[13px] leading-5",
        styles[variant],
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
