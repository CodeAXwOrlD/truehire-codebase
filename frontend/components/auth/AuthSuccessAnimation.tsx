"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Check, Sparkles, Lock, ArrowRight } from "lucide-react";

interface AuthSuccessAnimationProps {
  title?: string;
  subtitle?: string;
  destination?: string;
  onAnimationEnd?: () => void;
}

export function AuthSuccessAnimation({
  title = "Identity Verified",
  subtitle = "Decrypting secure session and granting access…",
  destination = "Dashboard",
  onAnimationEnd,
}: AuthSuccessAnimationProps) {
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(2), 400);
    const t2 = setTimeout(() => setStage(3), 900);
    const t3 = setTimeout(() => setStage(4), 1400);
    const t4 = setTimeout(() => {
      if (onAnimationEnd) onAnimationEnd();
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onAnimationEnd]);

  return (
    <div className="relative flex w-full max-w-sm flex-col items-center justify-center overflow-hidden rounded-card border border-teal/30 bg-[#0C1210] p-8 text-center shadow-[0_0_50px_rgba(47,191,168,0.15)] animate-in fade-in zoom-in-95 duration-300">
      {/* Background Hologram Grid Lines */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(47,191,168,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(47,191,168,0.03)_1px,transparent_1px)] bg-[size:16px_16px]" />

      {/* Concentric Radar Pulse Rings */}
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-teal/20 animate-ping duration-1000 opacity-40" />
        <div className="absolute -inset-3 rounded-full border border-teal/10 animate-pulse duration-1500" />
        
        {/* Central Shield Icon Container */}
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-teal/40 bg-teal/10 text-teal backdrop-blur-md shadow-[0_0_24px_rgba(47,191,168,0.3)]">
          {stage < 3 ? (
            <svg
              className="h-8 w-8 text-teal animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                strokeDasharray="60"
                strokeDashoffset={stage === 1 ? "30" : "0"}
                className="transition-all duration-500 ease-out"
              />
            </svg>
          ) : (
            <div className="flex items-center justify-center text-teal animate-in zoom-in-75 duration-300">
              <ShieldCheck size={36} className="text-teal" />
            </div>
          )}
        </div>
      </div>

      {/* Status Headlines */}
      <div className="mt-6 flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-teal">
          <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
          {stage === 1 && "Verifying Security Token"}
          {stage === 2 && "Validating Cryptographic Signature"}
          {stage === 3 && "Access Authorized"}
          {stage === 4 && "Redirecting to " + destination}
        </div>

        <h3 className="mt-3 text-lg font-bold tracking-tight text-ink">{title}</h3>
        <p className="mt-1 text-xs text-ink-dim max-w-[260px]">{subtitle}</p>
      </div>

      {/* Cyberpunk Status Terminal Ticker */}
      <div className="mt-6 w-full rounded-control border border-border/80 bg-bg/80 p-3 text-left font-mono text-[11px]">
        <div className="flex items-center justify-between text-ink-faint border-b border-border/40 pb-1.5 mb-1.5">
          <span>TRUEHIRE_AUTH_V2</span>
          <span className="text-teal">STATUS: 200 OK</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-ink-dim">
            <Check size={11} className="text-teal" />
            <span>Token: 256-bit ECDSA OK</span>
          </div>
          <div className="flex items-center gap-2 text-ink-dim">
            <Check size={11} className="text-teal" />
            <span>Anti-Ghost Verification: PASS</span>
          </div>
          {stage >= 3 && (
            <div className="flex items-center gap-2 text-teal font-semibold animate-in fade-in duration-200">
              <Sparkles size={11} className="text-teal" />
              <span>Workspace Session Initialized</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading Bar */}
      <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full bg-gradient-to-r from-teal to-teal-dim transition-all duration-500 ease-out"
          style={{ width: `${stage * 25}%` }}
        />
      </div>
    </div>
  );
}
