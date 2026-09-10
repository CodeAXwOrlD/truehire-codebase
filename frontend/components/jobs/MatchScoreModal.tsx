"use client";

import { X, Sparkles, CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MatchScoreResult } from "@/lib/api/candidate";
import { UnifiedJob } from "@/lib/api/jobs";

interface MatchScoreModalProps {
  job: UnifiedJob | null;
  match: MatchScoreResult | null;
  open: boolean;
  onClose: () => void;
}

export function MatchScoreModal({ job, match, open, onClose }: MatchScoreModalProps) {
  if (!open || !job || !match) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-score-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-teal/40 bg-[#121217] p-6 shadow-[0_20px_50px_rgba(47,191,168,0.2)] animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-teal" />
            <h2 id="match-score-title" className="text-base font-semibold text-ink">AI Match Breakdown</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-control p-1 text-ink-faint hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        {/* Top Score Banner */}
        <div className="mt-5 flex items-center justify-between rounded-card border border-teal/30 bg-teal/5 p-4">
          <div>
            <span className="text-xs font-mono text-ink-dim uppercase">{job.company}</span>
            <h3 className="text-sm font-semibold text-ink">{job.title}</h3>
            <p className="text-xs text-teal font-medium mt-0.5">{match.alignmentSummary}</p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-control border border-teal/40 bg-surface px-4 py-2">
            <span className="text-3xl font-bold font-mono text-teal">{match.matchPercentage}%</span>
            <span className="text-[10px] font-semibold uppercase text-ink-dim">Compatibility</span>
          </div>
        </div>

        {/* Matched Skills */}
        <div className="mt-5 flex flex-col gap-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-dim flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-teal" />
            Matched Skills ({match.matchedSkills.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {match.matchedSkills.length > 0 ? (
              match.matchedSkills.map((s, idx) => (
                <span
                  key={idx}
                  className="rounded-control border border-teal/30 bg-teal/10 px-2.5 py-1 text-xs font-mono text-teal"
                >
                  ✓ {s}
                </span>
              ))
            ) : (
              <span className="text-xs text-ink-faint">No exact skill overlap detected.</span>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        {match.missingSkills.length > 0 && (
          <div className="mt-4 flex flex-col gap-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-dim flex items-center gap-1.5">
              <AlertCircle size={13} className="text-amber-400" />
              Missing Skills / Recommended Focus ({match.missingSkills.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {match.missingSkills.map((s, idx) => (
                <span
                  key={idx}
                  className="rounded-control border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-mono text-amber-300"
                >
                  + {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {match.tailoringTips.length > 0 && (
          <div className="mt-5 rounded-control border border-border bg-glass p-3.5">
            <h4 className="text-xs font-medium text-ink-dim flex items-center gap-1.5">
              <Lightbulb size={13} className="text-teal" />
              Application Advice
            </h4>
            <p className="mt-1 text-xs text-ink">{match.tailoringTips[0]}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
