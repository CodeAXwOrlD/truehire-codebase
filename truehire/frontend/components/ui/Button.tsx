"use client";

import { forwardRef } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

// Variants per Design.md §6:
// primary = solid white bg / black text, secondary = outline, ghost = text-only, destructive = red
const variantClasses: Record<Variant, string> = {
  primary: "bg-ink text-bg hover:bg-ink/90",
  secondary: "border border-border text-ink hover:border-border-strong bg-transparent",
  ghost: "text-ink-dim hover:text-ink bg-transparent",
  destructive: "border border-red text-red hover:bg-red/10 bg-transparent",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", isLoading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "rounded-control px-4 py-2 text-sm font-medium transition-colors duration-150",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {isLoading ? "Please wait…" : children}
      </button>
    );
  }
);
Button.displayName = "Button";
