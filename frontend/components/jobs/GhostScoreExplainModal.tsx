"use client";

import { X, ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UnifiedJob } from "@/lib/api/jobs";

interface GhostScoreExplainModalProps {
  job: UnifiedJob | null;
  open: boolean;
  onClose: () => void;
}

export function GhostScoreExplainModal({ job, open, onClose }: GhostScoreExplainModalProps) {
  if (!open || !job) return null;

  const { score, riskLevel, reasons, recommendations } = job.ghostScore;

  const riskConfig = {
    low: {
      color: "text-teal",
      bg: "bg-teal/10 border-teal/30",
      icon: ShieldCheck,
      title: "Verified Active Requisition",
      badge: "Low Ghost Risk",
    },
    medium: {
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/30",
      icon: AlertTriangle,
      title: "Moderate Age / Monitor",
      badge: "Medium Ghost Risk",
    },
    high: {
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/30",
      icon: AlertOctagon,
      title: "High Ghost / Evergreen Risk",
      badge: "High Ghost Risk",
    },
  }[riskLevel];

  const Icon = riskConfig.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Ghost score explainability"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-card border border-border-strong bg-surface p-6 shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <Icon size={18} className={riskConfig.color} />
            <h2 className="text-base font-semibold text-ink">TrueHire Anti-Ghost Diagnosis</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-control p-1 text-ink-faint transition-colors hover:bg-glass-hover hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-card border p-4 bg-bg border-border">
          <div>
            <span className="text-xs font-mono text-ink-dim uppercase">Job Position</span>
            <h3 className="text-sm font-semibold text-ink">{job.title}</h3>
            <p className="text-xs text-ink-faint">{job.company} • Source: {job.source}</p>
          </div>

          <div className={`flex flex-col items-center justify-center rounded-control border px-4 py-2 ${riskConfig.bg}`}>
            <span className={`text-2xl font-bold font-mono ${riskConfig.color}`}>{score}/100</span>
            <span className={`text-[10px] font-semibold uppercase ${riskConfig.color}`}>{riskConfig.badge}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-dim">Algorithmic Signals Detected</h4>
          <ul className="flex flex-col gap-2">
            {reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-ink">
                <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${riskConfig.color}`} />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 rounded-control border border-border bg-glass p-3.5">
          <h4 className="text-xs font-medium text-ink-dim flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-teal" />
            TrueHire Recommendation
          </h4>
          <p className="mt-1 text-xs text-ink">
            {recommendations[0] || "Apply with confidence after checking role alignment."}
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose} className="text-xs">
            Close Diagnosis
          </Button>
        </div>
      </div>
    </div>
  );
}
