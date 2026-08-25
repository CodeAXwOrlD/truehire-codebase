"use client";

import { Topbar } from "@/components/dashboard/Topbar";
import { BarChart3, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <>
      <Topbar title="Hiring Analytics" />
      <main className="flex flex-1 flex-col gap-6 px-8 py-8">
        <div>
          <h2 className="text-xl font-semibold text-ink">Recruiter Analytics & Velocity</h2>
          <p className="mt-1 text-sm text-ink-dim">
            Metrics tracking time-to-fill, candidate conversion rates, and requisition freshness.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-card border border-border bg-surface p-5">
            <span className="text-xs font-medium text-ink-dim uppercase">Avg Time-to-Fill</span>
            <p className="mt-2 text-2xl font-bold font-mono text-ink">18 days</p>
            <span className="text-xs text-teal">↓ 4 days faster than industry benchmark</span>
          </div>

          <div className="rounded-card border border-border bg-surface p-5">
            <span className="text-xs font-medium text-ink-dim uppercase">Interview Conversion</span>
            <p className="mt-2 text-2xl font-bold font-mono text-ink">34%</p>
            <span className="text-xs text-ink-dim">Applications ➔ Interviews</span>
          </div>

          <div className="rounded-card border border-border bg-surface p-5">
            <span className="text-xs font-medium text-ink-dim uppercase">Offer Acceptance</span>
            <p className="mt-2 text-2xl font-bold font-mono text-ink">88%</p>
            <span className="text-xs text-teal">High hiring conversion</span>
          </div>

          <div className="rounded-card border border-border bg-surface p-5">
            <span className="text-xs font-medium text-ink-dim uppercase">Ghost Risk Score</span>
            <p className="mt-2 text-2xl font-bold font-mono text-teal">14/100</p>
            <span className="text-xs text-teal">Verified Active Employer</span>
          </div>
        </div>

        <div className="rounded-card border border-border bg-surface p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg text-teal">
            <BarChart3 size={20} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-ink">Interactive Velocity Charts (Phase 7)</h3>
          <p className="mt-1 text-sm text-ink-dim max-w-md mx-auto">
            Deep-dive requisition cohort tracking and historical conversion funnels will render here as candidate interview flows are logged.
          </p>
        </div>
      </main>
    </>
  );
}
