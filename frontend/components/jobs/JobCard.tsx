"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, MapPin, DollarSign, ExternalLink, HelpCircle, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UnifiedJob, applyToJob } from "@/lib/api/jobs";

interface JobCardProps {
  job: UnifiedJob;
  matchScore?: number;
  onExplainGhostScore: (job: UnifiedJob) => void;
  onExplainMatchScore?: (job: UnifiedJob) => void;
  onSelectJob: (job: UnifiedJob) => void;
}

export function JobCard({ job, matchScore, onExplainGhostScore, onExplainMatchScore, onSelectJob }: JobCardProps) {
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

  const sourceColors: Record<string, string> = {
    "Y Combinator": "border-orange-500/30 text-orange-400 bg-orange-500/5",
    "LinkedIn": "border-blue-500/30 text-blue-400 bg-blue-500/5",
    "RemoteOK": "border-teal/30 text-teal bg-teal/5",
    "Arbeitnow": "border-purple-500/30 text-purple-400 bg-purple-500/5",
    "Himalayas": "border-cyan-500/30 text-cyan-400 bg-cyan-500/5",
    "Remotive": "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
    "Jobicy": "border-violet-500/30 text-violet-400 bg-violet-500/5",
    "The Muse": "border-pink-500/30 text-pink-400 bg-pink-500/5",
    "FindWork": "border-amber-500/30 text-amber-400 bg-amber-500/5",
    "Indeed": "border-indigo-500/30 text-indigo-400 bg-indigo-500/5",
    "Glassdoor": "border-teal-500/30 text-teal-400 bg-teal-500/5",
    "ZipRecruiter": "border-green-500/30 text-green-400 bg-green-500/5",
    "JSearch": "border-blue-500/30 text-blue-400 bg-blue-500/5",
    "Adzuna": "border-yellow-500/30 text-yellow-400 bg-yellow-500/5",
    "Direct": "border-border text-ink-dim",
  };
  const sourceColor = sourceColors[job.source] || "border-border text-ink-dim";

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
      className="group relative flex flex-col justify-between rounded-xl border border-zinc-800/90 bg-[#121217] p-5 shadow-sm transition-all duration-150 hover:border-zinc-700 hover:bg-[#16161c] hover:shadow-lg hover:shadow-black/50 cursor-pointer"
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-900 text-sm font-bold font-mono text-white shadow-inner">
              {job.company.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-white group-hover:text-teal transition-colors line-clamp-2 leading-snug">
                {job.title}
              </h3>
              <p className="text-xs font-medium text-zinc-300 mt-1">{job.company}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Match Score Badge */}
            {matchScore !== undefined && onExplainMatchScore && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExplainMatchScore(job);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-teal/40 bg-teal/10 px-2.5 py-1 text-xs font-mono font-bold text-teal hover:bg-teal/20 transition-all shadow-sm"
                title="Click to view AI Match Breakdown"
              >
                <Sparkles size={12} />
                <span>{matchScore}% Match</span>
              </button>
            )}

            {/* Ghost Risk Badge */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExplainGhostScore(job);
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono font-bold transition-transform hover:scale-105 shadow-sm ${riskBadge.color}`}
              title="Click to view TrueHire Anti-Ghost Diagnosis"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${riskBadge.dot}`} />
              <span>Risk: {score}</span>
              <HelpCircle size={12} className="opacity-70" />
            </button>
          </div>
        </div>

        {/* Meta info row */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
            <MapPin size={13} className="text-zinc-400" />
            <span>{job.location}</span>
          </div>

          {job.salaryFormatted && (
            <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md">
              <DollarSign size={12} className="text-emerald-400" />
              <span>{job.salaryFormatted}</span>
            </div>
          )}

          <span className={`rounded-md border px-2.5 py-0.5 text-[11px] font-semibold ${sourceColor}`}>
            {job.source}
          </span>
        </div>

        {/* Tags */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {job.tags.slice(0, 5).map((tag, idx) => (
            <span
              key={idx}
              className="rounded-md border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-[11px] font-mono font-medium text-zinc-300 hover:border-zinc-700 transition-colors"
            >
              {tag}
            </span>
          ))}
          {job.tags.length > 5 && (
            <span className="rounded-md border border-zinc-800/80 bg-zinc-900/40 px-2 py-1 text-[10px] font-mono text-zinc-400">
              +{job.tags.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* Footer / Apply Action */}
      <div className="mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3.5 text-xs">
        <span className="font-mono text-zinc-400">{daysOpen === 0 ? "Posted today" : `${daysOpen}d ago`}</span>

        <div className="flex items-center gap-2">
          <Button
            variant={applied ? "secondary" : "primary"}
            disabled={applying || applied}
            onClick={handleApply}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold"
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
