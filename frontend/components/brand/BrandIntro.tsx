"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { ConnectionBars } from "@/components/brand/ConnectionBars";
import { Button } from "@/components/ui/Button";

export function BrandIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-16"
    >
      {/* Hero Container */}
      <div
        className={`flex max-w-3xl flex-col items-center gap-8 text-center transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
      >
        {/* Top Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/5 px-4 py-1.5 backdrop-blur-md">
          <ShieldCheck size={14} className="text-teal" />
          <span className="text-xs font-mono font-medium text-teal">
            Real jobs, verified intelligence.
          </span>
        </div>

        {/* Connection Bars Logo */}
        <div className="relative my-2">
          <div className="absolute inset-0 rounded-full bg-teal/20 blur-3xl" />
          <ConnectionBars size={110} />
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
            <Button variant="primary" className="group flex items-center gap-2 px-6 py-3 text-sm font-semibold">
              Get Started Free
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          <Link href="/sign-in">
            <Button variant="secondary" className="px-6 py-3 text-sm font-semibold">
              Sign In
            </Button>
          </Link>

          <Link href="/jobs">
            <Button variant="ghost" className="px-6 py-3 text-sm text-teal hover:text-teal/80">
              Browse Live Jobs ➔
            </Button>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 text-left sm:grid-cols-2 w-full">
          <div className="rounded-card border border-border bg-glass p-5 backdrop-blur-md transition-colors hover:border-border-strong">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <Zap size={16} className="text-teal" /> Candidate Protection
            </div>
            <p className="mt-1.5 text-xs text-ink-dim leading-relaxed">
              Instant AI risk scores on job listings before you spend hours applying to ghost positions.
            </p>
          </div>

          <div className="rounded-card border border-border bg-glass p-5 backdrop-blur-md transition-colors hover:border-border-strong">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <ShieldCheck size={16} className="text-teal" /> Recruiter Signals
            </div>
            <p className="mt-1.5 text-xs text-ink-dim leading-relaxed">
              Monitor requisition health metrics, velocity cohorts, and candidate pipeline clarity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
