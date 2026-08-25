"use client";

import { useEffect, useState } from "react";

/**
 * Alternate TrueHire mark — "Connection Bars".
 * Ported from the original animated HTML export (three horizontal bars +
 * vertical stem, teal→cyan gradient). Kept as an explored alternate/hero
 * asset per Design.md §7 — product chrome (nav/favicon) uses VerifiedBeacon
 * for consistency; this is for marketing/hero moments where the extra
 * motion is welcome.
 *
 * Uses styled-jsx (built into Next.js) so the keyframes stay scoped to this
 * component instead of leaking into global CSS.
 */
interface ConnectionBarsProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function ConnectionBars({ size = 96, showWordmark = false, className }: ConnectionBarsProps) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t1 = requestAnimationFrame(() =>
      requestAnimationFrame(() => setTimeout(() => setSettled(true), 550))
    );
    return () => cancelAnimationFrame(t1);
  }, []);

  return (
    <div className={`cb-stage ${className ?? ""}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="280 280 464 464"
        role="img"
        aria-label="TrueHire connection-bars mark"
      >
        <defs>
          <linearGradient id="cb-g" gradientUnits="userSpaceOnUse" x1="330" y1="330" x2="694" y2="694">
            <stop offset="0%" stopColor="#2FBFA8" />
            <stop offset="100%" stopColor="#5CD3F2" />
          </linearGradient>
        </defs>
        <g className={`cb-mark ${settled ? "cb-settled" : ""}`}>
          <g fill="none" stroke="#5CD3F2" strokeLinecap="round" strokeLinejoin="round">
            <path className="cb-bar1" d="M 330 330 L 694 330" stroke="url(#cb-g)" strokeWidth="46" />
            <path
              className="cb-bar2"
              d="M 370 414 L 638 414"
              stroke="url(#cb-g)"
              strokeWidth="30"
              strokeOpacity="0.85"
            />
            <path
              className="cb-bar3"
              d="M 410 498 L 582 498"
              stroke="url(#cb-g)"
              strokeWidth="18"
              strokeOpacity="0.7"
            />
            <path className="cb-stem" d="M 512 330 L 512 694" stroke="url(#cb-g)" strokeWidth="46" />
          </g>
        </g>
      </svg>

      {showWordmark && (
        <div className="cb-word">
          TRUE<span className="cb-word-hire">HIRE</span>
        </div>
      )}

      <style jsx>{`
        .cb-stage {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .cb-mark {
          transform-box: fill-box;
          transform-origin: center;
        }
        .cb-bar1,
        .cb-bar2,
        .cb-bar3,
        .cb-stem {
          transform-box: fill-box;
          transform-origin: center;
          opacity: 1;
          transition: opacity 0.5s cubic-bezier(0.2, 0.9, 0.25, 1.2);
        }
        .cb-settled {
          animation: cb-float 3.8s ease-in-out infinite;
        }
        @keyframes cb-float {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(0, -8px, 0) scale(1.015);
          }
        }
        .cb-settled .cb-bar1 {
          animation: cb-wave1 2.8s ease-in-out infinite;
        }
        .cb-settled .cb-bar2 {
          animation: cb-wave2 2.8s ease-in-out 0.18s infinite;
        }
        .cb-settled .cb-bar3 {
          animation: cb-wave3 2.8s ease-in-out 0.36s infinite;
        }
        @keyframes cb-wave1 {
          0%,
          100% {
            transform: translate(0, 0) scaleX(1);
          }
          50% {
            transform: translate(-4px, -2px) scaleX(1.02);
          }
        }
        @keyframes cb-wave2 {
          0%,
          100% {
            transform: translate(0, 0) scaleX(1);
          }
          50% {
            transform: translate(4px, 1px) scaleX(0.98);
          }
        }
        @keyframes cb-wave3 {
          0%,
          100% {
            transform: translate(0, 0) scaleX(1);
          }
          50% {
            transform: translate(-3px, 2px) scaleX(1.03);
          }
        }
        .cb-stage:hover :global(.cb-bar1),
        .cb-stage:hover :global(.cb-bar2),
        .cb-stage:hover :global(.cb-bar3) {
          filter: drop-shadow(0 0 8px rgba(92, 211, 242, 0.35));
        }
        .cb-word {
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 2px;
          margin-top: 6px;
          text-align: center;
          color: #f2f2f3;
        }
        .cb-word-hire {
          background: linear-gradient(90deg, #2fbfa8, #5cd3f2);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
      `}</style>
    </div>
  );
}
