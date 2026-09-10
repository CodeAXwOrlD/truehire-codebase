"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Share2,
  Check,
  Briefcase,
  MapPin,
  Clock,
  GraduationCap,
  DollarSign,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Layers,
  ArrowRight,
} from "lucide-react";
import { UnifiedJob } from "@/lib/api/jobs";
import { RichJobDescription } from "@/components/jobs/RichJobDescription";

interface JobDetailsModalProps {
  job: UnifiedJob | null;
  open: boolean;
  onClose: () => void;
  matchScore?: number;
  onExplainGhostScore: (job: UnifiedJob) => void;
  onExplainMatchScore: (job: UnifiedJob) => void;
  onSelectTag?: (tag: string) => void;
}

type TabType = "specification" | "match" | "ghost";

function formatTimeAgo(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function JobDetailsModal({
  job,
  open,
  onClose,
  matchScore,
  onExplainGhostScore,
  onExplainMatchScore,
  onSelectTag,
}: JobDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("specification");
  const [copied, setCopied] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  // Reset tab when job changes
  useEffect(() => {
    setActiveTab("specification");
    setCopied(false);
  }, [job?.id]);

  if (!open || !job) return null;

  const { score, riskLevel, reasons, recommendations } = job.ghostScore;

  const ghostRiskColor =
    riskLevel === "low"
      ? "text-teal"
      : riskLevel === "medium"
      ? "text-amber-400"
      : "text-red-400";

  const ghostRiskBorder =
    riskLevel === "low"
      ? "border-teal/30 bg-teal/5"
      : riskLevel === "medium"
      ? "border-amber-500/30 bg-amber-500/5"
      : "border-red-500/30 bg-red-500/5";

  function handleCopyShare() {
    if (!job) return;
    const shareText = `${job.title} at ${job.company} — Verified on TrueHire: ${job.applyUrl}`;
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-zinc-700/80 bg-[#121217] shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* ── Modal Header ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-zinc-800/80 px-6 py-5 bg-zinc-900/60 gap-4">
          <div className="flex items-start gap-4 min-w-0">
            {/* Company Avatar / Logo */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800 text-lg font-bold font-mono text-white shadow-md overflow-hidden">
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={job.company}
                  className="h-full w-full rounded-2xl object-contain p-1"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              ) : (
                job.company.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold font-mono text-teal uppercase tracking-wider">
                  {job.company}
                </span>
                <span className="text-xs text-zinc-500">·</span>
                <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                  via {job.source}
                </span>
                <span className="rounded-md border border-teal/30 bg-teal/10 px-2 py-0.5 text-[11px] font-semibold text-teal flex items-center gap-1">
                  <ShieldCheck size={12} />
                  Verified Feed
                </span>
              </div>

              <h2
                id="job-modal-title"
                className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug mt-1 truncate"
                title={job.title}
              >
                {job.title}
              </h2>

              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-zinc-500" />
                  {job.location}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-zinc-500" />
                  {formatTimeAgo(job.postedAt)}
                </span>
                {job.experienceLevel !== "any" && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 capitalize">
                      <GraduationCap size={12} className="text-zinc-500" />
                      {job.experienceLevel} Level
                    </span>
                  </>
                )}
                {job.jobType !== "any" && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 capitalize">
                      <Briefcase size={12} className="text-zinc-500" />
                      {job.jobType}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyShare}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
              title="Share job link"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-teal" />
                  <span className="text-teal">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
              aria-label="Close job details"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Key Metrics 4-Grid Bar ────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:px-6 bg-zinc-900/40 border-b border-zinc-800/80 shrink-0">
          {/* Compensation */}
          <div className="flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Compensation
            </span>
            <span className="mt-1 font-mono text-sm font-bold text-emerald-400 truncate">
              {job.salaryFormatted || "Competitive Base"}
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5">Estimated Base</span>
          </div>

          {/* Ghost Risk */}
          <div
            onClick={() => setActiveTab("ghost")}
            className="flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 cursor-pointer hover:border-zinc-700 transition-colors"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Ghost Risk
            </span>
            <span className={`mt-1 font-mono text-sm font-bold ${ghostRiskColor}`}>
              {score}/100 ({riskLevel.toUpperCase()})
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
              Anti-Ghost Health &rarr;
            </span>
          </div>

          {/* AI Compatibility */}
          <div
            onClick={() => setActiveTab("match")}
            className="flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 cursor-pointer hover:border-teal/40 transition-colors"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              AI Compatibility
            </span>
            <span className="mt-1 font-mono text-sm font-bold text-teal flex items-center gap-1">
              <Sparkles size={13} />
              {matchScore !== undefined ? `${matchScore}% Match` : "Ready"}
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
              Profile Alignment &rarr;
            </span>
          </div>

          {/* Workplace */}
          <div className="flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Workplace
            </span>
            <span className="mt-1 font-medium text-sm text-white flex items-center gap-1">
              {job.isRemote ? "🌍 Remote" : "🏢 On-site"}
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5 truncate">{job.location}</span>
          </div>
        </div>

        {/* ── Tab Switcher ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-zinc-800/80 bg-zinc-900/20 shrink-0">
          <button
            onClick={() => setActiveTab("specification")}
            className={`flex items-center gap-2 pb-3 px-1 text-xs font-semibold tracking-wide border-b-2 transition-all ${
              activeTab === "specification"
                ? "border-teal text-teal"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Briefcase size={14} />
            Job Specification
          </button>

          <button
            onClick={() => setActiveTab("match")}
            className={`flex items-center gap-2 pb-3 px-1 text-xs font-semibold tracking-wide border-b-2 transition-all ${
              activeTab === "match"
                ? "border-teal text-teal"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles size={14} />
            AI Match Breakdown
            {matchScore !== undefined && (
              <span className="rounded-full bg-teal/20 text-teal px-1.5 py-0.2 text-[10px] font-mono">
                {matchScore}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("ghost")}
            className={`flex items-center gap-2 pb-3 px-1 text-xs font-semibold tracking-wide border-b-2 transition-all ${
              activeTab === "ghost"
                ? "border-teal text-teal"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ShieldCheck size={14} />
            Anti-Ghost Signals
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                riskLevel === "low"
                  ? "bg-teal/20 text-teal"
                  : riskLevel === "medium"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {score}/100
            </span>
          </button>
        </div>

        {/* ── Scrollable Body ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: SPECIFICATION */}
          {activeTab === "specification" && (
            <div className="space-y-6">
              {/* Quick Anti-Ghost Signal Summary Banner */}
              <div className={`rounded-xl border p-4 ${ghostRiskBorder}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className={ghostRiskColor} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Anti-Ghost Verification: {riskLevel.toUpperCase()} RISK ({score}/100)
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("ghost")}
                    className="text-xs text-teal font-semibold hover:underline"
                  >
                    View All Signals &rarr;
                  </button>
                </div>
                <p className="text-xs text-zinc-300">
                  {reasons[0] || "Active requisition verified from direct company feed."}
                </p>
              </div>

              {/* Required Competencies & Tech Stack Tags */}
              {job.tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
                    Required Competencies &amp; Tech Stack
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => onSelectTag?.(tag)}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs font-mono font-medium text-zinc-200 hover:border-teal hover:text-teal transition-colors"
                        title={`Filter by ${tag}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Job Specification - Cleanly Rendered HTML / Formatted Text */}
              <div>
                <h3 className="text-base font-bold text-white mb-3 border-b border-zinc-800 pb-2 flex items-center justify-between">
                  <span>Complete Job Specification</span>
                  <span className="text-xs font-mono text-zinc-500 font-normal">
                    Direct from {job.source}
                  </span>
                </h3>
                <RichJobDescription content={job.description} />
              </div>
            </div>
          )}

          {/* TAB 2: AI MATCH BREAKDOWN */}
          {activeTab === "match" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-teal/40 bg-teal/5 p-5">
                <div>
                  <span className="text-xs font-mono text-zinc-400 uppercase">
                    AI Candidate Compatibility
                  </span>
                  <h3 className="text-base font-semibold text-white mt-1">
                    {job.title} at {job.company}
                  </h3>
                  <p className="text-xs text-teal font-medium mt-1">
                    Calculated using TrueHire Python NLP matching heuristics against active skills.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center rounded-xl border border-teal/40 bg-zinc-900 px-5 py-3">
                  <span className="text-3xl font-bold font-mono text-teal">
                    {matchScore !== undefined ? `${matchScore}%` : "Ready"}
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-zinc-400 mt-0.5">
                    Fit Score
                  </span>
                </div>
              </div>

              {/* Tech Stack Match Matrix */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-teal" />
                  Role Competencies Evaluated
                </h4>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1.5 rounded-lg border border-teal/30 bg-teal/10 px-3 py-1.5 text-xs font-mono text-teal"
                    >
                      <Check size={12} />
                      <span>{tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategic Insights */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-teal" />
                  Resume &amp; Interview Recommendation
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Tailor your application highlighting hands-on deliverables in{" "}
                  <strong className="text-white">{job.tags.slice(0, 3).join(", ") || "core tech stack"}</strong>.
                  Emphasize scalable architecture and end-to-end ownership in your past experience.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => onExplainMatchScore(job)}
                  className="flex items-center gap-1.5 rounded-lg border border-teal/40 bg-teal/10 px-4 py-2 text-xs font-bold text-teal hover:bg-teal/20 transition-colors"
                >
                  <Sparkles size={13} />
                  Open Dedicated Match Breakdown Modal &rarr;
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ANTI-GHOST SIGNALS */}
          {activeTab === "ghost" && (
            <div className="space-y-6">
              <div className={`flex items-center justify-between rounded-xl border p-5 ${ghostRiskBorder}`}>
                <div>
                  <span className="text-xs font-mono text-zinc-400 uppercase">
                    Anti-Ghost Requisition Health
                  </span>
                  <h3 className="text-base font-semibold text-white mt-1">
                    {riskLevel === "low"
                      ? "Verified Active Requisition"
                      : riskLevel === "medium"
                      ? "Moderate Posting Age / Monitor"
                      : "High Ghost / Evergreen Requisition Risk"}
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1">
                    Score evaluated across 5 verification vectors: posting recency, hiring velocity, ATS presence, recruiter activity, and domain health.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3">
                  <span className={`text-3xl font-bold font-mono ${ghostRiskColor}`}>
                    {score}/100
                  </span>
                  <span className={`text-[10px] font-semibold uppercase ${ghostRiskColor} mt-0.5`}>
                    {riskLevel} Risk
                  </span>
                </div>
              </div>

              {/* Algorithmic Signals Detected */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                  Algorithmic Verification Signals
                </h4>
                <div className="space-y-2.5">
                  {reasons.map((reason, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 text-xs text-zinc-200"
                    >
                      <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${ghostRiskColor}`} />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TrueHire Safety Recommendation */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-teal" />
                  TrueHire Recommendation
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {recommendations[0] ||
                    "This listing exhibits verified activity. Submit your application directly through the employer board."}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => onExplainGhostScore(job)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
                >
                  <ShieldCheck size={13} />
                  Open Full Anti-Ghost Diagnosis Dialog &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sticky Action Footer ──────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-zinc-800/80 px-6 py-4 bg-zinc-900/90 backdrop-blur-md gap-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => onExplainMatchScore(job)}
              className="flex items-center gap-1.5 rounded-xl border border-teal/40 bg-teal/10 px-3.5 py-2 text-xs font-bold text-teal hover:bg-teal/20 transition-colors"
            >
              <Sparkles size={13} />
              <span>Match Breakdown</span>
            </button>
            <button
              onClick={() => onExplainGhostScore(job)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <ShieldCheck size={13} />
              <span>Ghost Risk</span>
            </button>
          </div>

          <a
            href={job.applyUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2 rounded-xl bg-teal px-6 py-2.5 text-xs font-bold text-black hover:bg-teal/90 shadow-lg shadow-teal/20 transition-all shrink-0"
          >
            <span>Apply on {job.source}</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
