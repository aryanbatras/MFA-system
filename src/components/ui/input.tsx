import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full border border-zinc-200 bg-white px-4 py-2.5",
          "text-[15px] text-zinc-900 placeholder:text-zinc-400",
          "transition-colors duration-150",
          "focus:outline-none focus:border-zinc-900 focus:ring-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "font-[var(--font-sans)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
