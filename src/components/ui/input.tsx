import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-none border border-zinc-300 bg-white px-4 py-2.5",
          "text-[15px] text-zinc-950 placeholder:text-zinc-500",
          "transition-none",
          "focus:border-zinc-950 focus:outline-none focus:ring-0",
          "aria-invalid:border-red-700",
          "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
