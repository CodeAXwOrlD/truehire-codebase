"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, type, className, ...props },
  ref
) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink-dim">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={inputId}
          ref={ref}
          type={inputType}
          className={`w-full rounded-control border border-border bg-glass px-3.5 py-2.5 text-ink outline-none transition-colors placeholder:text-ink-faint hover:border-border-strong focus:border-border-strong ${
            isPassword ? "pr-10" : ""
          } ${className ?? ""}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-ink-dim hover:text-ink focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red">{error}</p>}
    </div>
  );
});
