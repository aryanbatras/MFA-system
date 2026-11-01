"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  className?: string;
};

const EMPTY = " ";

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  invalid = false,
  ariaLabel = "One-time code",
  className,
}: OtpInputProps) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = React.useState<string[]>(() =>
    normalizeValue(value, length),
  );

  React.useEffect(() => {
    setDigits(normalizeValue(value, length));
  }, [value, length]);

  React.useEffect(() => {
    if (autoFocus) {
      refs.current[0]?.focus();
    }
  }, [autoFocus]);

  function commit(next: string[]) {
    setDigits(next);
    onChange(next.join(""));
  }

  function setDigit(index: number, digit: string) {
    const next = [...digits];
    next[index] = digit || EMPTY;
    commit(next);

    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleChange(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");

    if (!clean) {
      setDigit(index, "");
      return;
    }

    if (clean.length > 1) {
      fillFrom(index, clean);
      return;
    }

    setDigit(index, clean);
  }

  function fillFrom(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "").slice(0, length - index);
    if (!clean) return;

    const next = [...digits];
    for (let offset = 0; offset < clean.length; offset += 1) {
      next[index + offset] = clean[offset];
    }
    commit(next);

    const focusIndex = Math.min(index + clean.length, length - 1);
    refs.current[focusIndex]?.focus();
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace") {
      event.preventDefault();

      if (digits[index] !== EMPTY) {
        setDigit(index, "");
        return;
      }

      if (index > 0) {
        const next = [...digits];
        next[index - 1] = EMPTY;
        commit(next);
        refs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) {
    event.preventDefault();
    fillFrom(index, event.clipboardData.getData("text"));
  }

  return (
    <div
      className={cn("grid grid-cols-6 gap-2", className)}
      role="group"
      aria-label={ariaLabel}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit === EMPTY ? "" : digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.currentTarget.select()}
          className={cn(
            "h-14 w-full min-w-0 rounded-none border border-zinc-300 bg-white",
            "text-center font-mono text-[24px] font-medium tabular-nums text-zinc-950",
            "transition-none outline-none",
            "focus:border-zinc-950 focus:ring-0",
            "aria-invalid:border-red-700",
            "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500",
          )}
        />
      ))}
    </div>
  );
}

function normalizeValue(value: string, length: number): string[] {
  const chars = value.padEnd(length, EMPTY).slice(0, length).split("");
  return chars.map((char) => (/^\d$/.test(char) ? char : EMPTY));
}

export function isOtpComplete(value: string, length = 6): boolean {
  return (
    value.length === length &&
    !value.includes(EMPTY) &&
    /^\d+$/.test(value)
  );
}
