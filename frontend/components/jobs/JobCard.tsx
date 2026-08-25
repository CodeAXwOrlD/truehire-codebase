"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, MapPin, DollarSign, ExternalLink, HelpCircle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UnifiedJob, applyToJob } from "@/lib/api/jobs";

interface JobCardProps {
  job: UnifiedJob;
  onExplainGhostScore: (job: UnifiedJob) => void;
  onSelectJob: (job: UnifiedJob) => void;
}

export function JobCard({ job, onExplainGhostScore, onSelectJob }: JobCardProps) {
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  const { score, riskLevel } = job.ghostScore;

  const riskBadge = {
    low: {
      color: "text-teal border-teal/30 bg-teal/10",
      dot: "bg-teal",
      label: "Verified Active",
      icon: ShieldCheck,
    },
    medium: {
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      dot: "bg-amber-400",
      label: "Moderate Risk",
      icon: AlertTriangle,
    },
    high: {
      color: "text-red-400 border-red-500/30 bg-red-500/10",
      dot: "bg-red-400",
      label: "High Ghost Risk",
      icon: AlertOctagon,
    },
  }[riskLevel];

  const sourceColors = {
    "Y Combinator": "border-orange-500/30 text-orange-400 bg-orange-500/5",
    "LinkedIn": "border-blue-500/30 text-blue-400 bg-blue-500/5",
    "RemoteOK": "border-teal/30 text-teal bg-teal/5",
    "Arbeitnow": "border-purple-500/30 text-purple-400 bg-purple-500/5",
    "Direct": "border-border text-ink-dim",
  }[job.source] || "border-border text-ink-dim";

  const daysOpen = Math.floor(
    (Date.now() - new Date(job.postedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  async function handleApply(e: React.MouseEvent) {
    e.stopPropagation();
    setApplying(true);
    await applyToJob(job.id);
    setApplying(false);
    setApplied(true);
  }

  return (
    <div
      onClick={() => onSelectJob(job)}
      className="group relative flex flex-col justify-between rounded-card border border-border bg-surface p-5 transition-all duration-150 hover:border-border-strong hover:bg-glass-hover cursor-pointer"
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-border bg-bg text-sm font-bold font-mono text-ink">
              {job.company.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink group-hover:text-teal transition-colors line-clamp-1">
                {job.title}
              </h3>
              <p className="text-xs text-ink-dim">{job.company}</p>
            </div>
          </div>

          {/* Ghost Risk Badge */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExplainGhostScore(job);
            }}
            className={`flex items-center gap-1.5 rounded-control border px-2.5 py-1 text-xs font-mono font-medium transition-transform hover:scale-105 ${riskBadge.color}`}
            title="Click to view TrueHire Anti-Ghost Diagnosis"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${riskBadge.dot}`} />
            <span>Risk: {score}</span>
            <HelpCircle size={12} className="opacity-70" />
          </button>
        </div>

        {/* Meta info row */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2.5 text-xs text-ink-dim">
          <div className="flex items-center gap-1">
            <MapPin size={13} className="text-ink-faint" />
            <span>{job.location}</span>
          </div>

          {job.salaryFormatted && (
            <div className="flex items-center gap-1 font-mono text-ink">
              <DollarSign size={13} className="text-teal" />
              <span>{job.salaryFormatted}</span>
            </div>
          )}

          <span className={`rounded-control border px-2 py-0.5 text-[11px] ${sourceColors}`}>
            {job.source}
          </span>
        </div>

        {/* Tags */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {job.tags.map((tag, idx) => (
            <span
              key={idx}
              className="rounded-control border border-border/80 bg-bg px-2 py-0.5 text-[11px] font-mono text-ink-dim"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer / Apply Action */}
      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-ink-faint">
        <span className="font-mono">{daysOpen === 0 ? "Posted today" : `${daysOpen}d ago`}</span>

        <div className="flex items-center gap-2">
          <Button
            variant={applied ? "secondary" : "primary"}
            disabled={applying || applied}
            onClick={handleApply}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            {applying ? (
              <Loader2 size={13} className="animate-spin" />
            ) : applied ? (
              <>
                <Check size={13} className="text-teal" />
                Applied
              </>
            ) : (
              <>
                Apply
                <ExternalLink size={12} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
