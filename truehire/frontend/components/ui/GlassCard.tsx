"use client";

import { useRef, type ReactNode } from "react";
import clsx from "clsx";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Monochrome glass card with a cursor-tracking spotlight (Design.md §5.1).
 * Backdrop-blur + faint white tint — NOT the purple/indigo glow from the
 * rejected Lumina system, and no ambient/looping motion. The glow only
 * exists while the cursor is over the card, and fades out on leave.
 */
export function GlassCard({ children, className, onClick }: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
    card.style.setProperty("--spot-opacity", "1");
  }

  function handleMouseLeave() {
    cardRef.current?.style.setProperty("--spot-opacity", "0");
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={clsx(
        "group relative overflow-hidden rounded-card border border-border bg-glass backdrop-blur-md transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.08)]",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Spotlight layer — pure white glow, position driven by CSS vars set on mousemove */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[var(--spot-opacity,0)] transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(220px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(255,255,255,0.06), transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
