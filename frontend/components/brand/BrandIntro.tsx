"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { ConnectionBars } from "@/components/brand/ConnectionBars";
import { VerifiedBeacon } from "@/components/brand/VerifiedBeacon";
import { Button } from "@/components/ui/Button";

type Stage = "offscreen" | "fly-in" | "hold" | "expand-out" | "hero";

export function BrandIntro() {
  const [stage, setStage] = useState<Stage>("offscreen");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t0 = setTimeout(() => setStage("fly-in"), 50);
    const t1 = setTimeout(() => setStage("hold"), 1000);
    const t2 = setTimeout(() => setStage("expand-out"), 2000);
    const t3 = setTimeout(() => setStage("hero"), 2700);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-12"
    >

      {/* Intro Sequence: Flying Shield -> Expands Out */}
      {stage !== "hero" && (
        <div
          className="absolute transition-all duration-700 ease-out"
          style={{
            transitionDuration:
              stage === "fly-in" ? "950ms" : stage === "expand-out" ? "650ms" : "400ms",
            transitionTimingFunction:
              stage === "fly-in"
                ? "cubic-bezier(0.16, 1, 0.3, 1)"
                : "cubic-bezier(0.7, 0, 0.84, 0)",
            opacity: stage === "offscreen" ? 0 : stage === "expand-out" ? 0 : 1,
            transform:
              stage === "offscreen"
                ? "translateY(-80vh) scale(2.8)"
                : stage === "fly-in" || stage === "hold"
                  ? "translateY(0) scale(1.6)"
                  : "translateY(0) scale(4.5)",
            filter: stage === "expand-out" ? "blur(18px)" : "blur(0px)",
          }}
        >
          <VerifiedBeacon size={90} animate={true} />
        </div>
      )}

      {/* Hero Reveal: T-Logo + TrueHire Content + CTA */}
      <div
        className="flex max-w-3xl flex-col items-center gap-8 text-center transition-all duration-1000 ease-out"
        style={{
          opacity: stage === "hero" ? 1 : 0,
          transform: stage === "hero" ? "translateY(0) scale(1)" : "translateY(30px) scale(0.92)",
        }}
      >
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-glass px-4 py-1.5 backdrop-blur-md">
          <ShieldCheck size={14} className="text-teal" />
          <span className="text-xs font-medium text-ink-dim">
            Real jobs, verified intelligence.
          </span>
        </div>

        {/* Connection Bars T-Logo */}
        <div className="relative my-2">
          <div className="absolute inset-0 rounded-full bg-teal-dim/30 blur-3xl" />
          <ConnectionBars size={120} />
        </div>

        {/* Title & Subtitle */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">
            True<span className="bg-gradient-to-r from-teal to-[#5CD3F2] bg-clip-text text-transparent">Hire</span>
          </h1>
          <p className="max-w-xl text-base text-ink-dim sm:text-lg">
            Ghost-job risk scoring for candidates. Requisition risk signals for recruiters.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/sign-up">
            <Button variant="primary" className="group flex items-center gap-2 px-6 py-3 text-sm">
              Get Started Free
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          <Link href="/sign-in">
            <Button variant="secondary" className="px-6 py-3 text-sm">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Live Feature Highlights */}
        <div className="mt-8 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
          <div className="rounded-card border border-border bg-glass p-4 backdrop-blur-md">
            <div className="flex items-center gap-2 font-medium text-ink">
              <Zap size={16} className="text-teal" /> Candidate Protection
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              Instant risk scores on job listings before you spend hours applying to ghost positions.
            </p>
          </div>

          <div className="rounded-card border border-border bg-glass p-4 backdrop-blur-md">
            <div className="flex items-center gap-2 font-medium text-ink">
              <ShieldCheck size={16} className="text-teal" /> Recruiter Signals
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              Monitor requisition health metrics, ghosting risks, and candidate signal clarity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
