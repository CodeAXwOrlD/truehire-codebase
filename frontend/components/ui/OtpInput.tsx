"use client";

import React, { useRef, useEffect } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (code: string) => void;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
  onComplete,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Split string into array of characters
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) return;

    const char = rawVal[rawVal.length - 1]; // take last entered digit
    const newDigits = [...digits];
    newDigits[index] = char;
    const nextCode = newDigits.join("").slice(0, length);
    onChange(nextCode);

    if (nextCode.length === length && onComplete) {
      onComplete(nextCode);
    }

    // Auto move to next input
    if (index < length - 1 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Current box empty, delete previous and move focus back
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        inputsRef.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;

    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIndex]?.focus();

    if (pasted.length === length && onComplete) {
      onComplete(pasted);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2.5 sm:gap-3">
      {Array.from({ length }).map((_, index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <div key={index} className="relative flex-1">
            <input
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digits[index]}
              disabled={disabled}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className={`h-14 w-full rounded-control border bg-surface text-center font-mono text-2xl font-bold tracking-tight text-ink transition-all duration-150 outline-none
                ${
                  isFilled
                    ? "border-teal/50 bg-teal/[0.03] text-teal shadow-[0_0_12px_rgba(47,191,168,0.12)]"
                    : "border-border hover:border-border-strong focus:border-teal focus:ring-1 focus:ring-teal/30"
                }
                ${disabled ? "cursor-not-allowed opacity-50" : ""}
              `}
            />
            {/* Hairline bottom accent dot */}
            <div
              className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full transition-colors ${
                isFilled ? "bg-teal" : "bg-transparent"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
