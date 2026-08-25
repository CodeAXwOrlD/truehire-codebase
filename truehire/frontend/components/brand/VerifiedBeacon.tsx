"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Primary TrueHire mark — "Verified Beacon".
 * Shield outline with a checkmark that draws in once on mount/replay.
 * Static everywhere else (favicon, docs, email) per Design.md §7 — the
 * draw-in animation is reserved for hero/loading moments only.
 */
interface VerifiedBeaconProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export function VerifiedBeacon({ size = 96, animate = true, className }: VerifiedBeaconProps) {
  const [played, setPlayed] = useState(!animate);
  const shieldRef = useRef<SVGPathElement>(null);
  const checkRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!animate) return;
    const t = requestAnimationFrame(() => setPlayed(true));
    return () => cancelAnimationFrame(t);
  }, [animate]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      role="img"
      aria-label="TrueHire logo"
    >
      <defs>
        <linearGradient id="beacon-gradient" x1="10" y1="6" x2="90" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2FBFA8" />
          <stop offset="100%" stopColor="#5CD3F2" />
        </linearGradient>
      </defs>

      {/* Shield outline */}
      <path
        ref={shieldRef}
        d="M50 6 L88 20 V48 C88 70 72 86 50 94 C28 86 12 70 12 48 V20 L50 6 Z"
        stroke="url(#beacon-gradient)"
        strokeWidth="4.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{
          strokeDasharray: 260,
          strokeDashoffset: played ? 0 : 260,
          transition: "stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      {/* Check-stroke */}
      <path
        ref={checkRef}
        d="M34 51 L46 63 L68 37"
        stroke="url(#beacon-gradient)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 52,
          strokeDashoffset: played ? 0 : 52,
          transition: "stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.55s",
        }}
      />
    </svg>
  );
}

/** Full lockup: mark + "TrueHire" wordmark, per Design.md §7 */
export function VerifiedBeaconWordmark({ animate = true }: { animate?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <VerifiedBeacon size={32} animate={animate} />
      <span className="font-sans text-xl font-bold tracking-tight text-ink">
        True<span className="text-teal">Hire</span>
      </span>
    </div>
  );
}
