"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VerifiedBeaconWordmark } from "@/components/brand/VerifiedBeacon";
import { JobCard } from "@/components/jobs/JobCard";
import { GhostScoreExplainModal } from "@/components/jobs/GhostScoreExplainModal";
import { fetchJobs, UnifiedJob } from "@/lib/api/jobs";
import { Search, SlidersHorizontal, Radio, ShieldCheck, Briefcase, ExternalLink, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

const SOURCE_TABS = ["all", "Y Combinator", "LinkedIn", "RemoteOK", "Arbeitnow"];

export default function CandidateJobsPage() {
  const [jobs, setJobs] = useState<UnifiedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [maxRisk, setMaxRisk] = useState<number>(100);
  const [selectedJob, setSelectedJob] = useState<UnifiedJob | null>(null);
  const [explainJob, setExplainJob] = useState<UnifiedJob | null>(null);
  const [liveStreamConnected, setLiveStreamConnected] = useState(true);

  async function loadJobs() {
    setLoading(true);
    const res = await fetchJobs({
      search: search || undefined,
      isRemote: remoteOnly ? true : undefined,
      maxRiskScore: maxRisk < 100 ? maxRisk : undefined,
      source: sourceFilter,
    });
    setLoading(false);
    if (res.data) {
      setJobs(res.data);
    }
  }

  useEffect(() => {
    loadJobs();
  }, [sourceFilter, remoteOnly, maxRisk]);

  // Connect to SSE stream for live real-time job ingestion
  useEffect(() => {
    const sseUrl = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/jobs/stream`;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setLiveStreamConnected(true);
      };

      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === "NEW_JOB" && payload.job) {
            setJobs((prev) => {
              if (prev.some((j) => j.id === payload.job.id)) return prev;
              return [payload.job, ...prev];
            });
          }
        } catch (err) {
          console.warn("[SSE] Parse error:", err);
        }
      };

      eventSource.onerror = () => {
        setLiveStreamConnected(false);
      };
    } catch {
      setLiveStreamConnected(false);
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  const filteredJobs = jobs.filter((j) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/90 px-8 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <VerifiedBeaconWordmark />
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/jobs" className="text-teal font-medium">
              Live Jobs
            </Link>
            <Link href="/applications" className="text-ink-dim hover:text-ink transition-colors">
              My Applications
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Feed Pulse Status */}
          <div className="flex items-center gap-2 rounded-control border border-teal/30 bg-teal/5 px-3 py-1 text-xs text-teal font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
            </span>
            <span>Live Stream Active ({jobs.length})</span>
          </div>

          <Link href="/sign-in">
            <Button variant="secondary" className="text-xs">
              Recruiter Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Hero & Search Banner */}
      <main className="flex flex-1 flex-col px-8 py-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">
            Real-Time Verified Tech Jobs
          </h1>
          <p className="text-sm text-ink-dim max-w-2xl">
            Continuously aggregated from Y Combinator, LinkedIn, RemoteOK, and top tech career portals.
            Every listing is screened by our <span className="text-teal font-medium">Anti-Ghosting Algorithm</span>.
          </p>
        </div>

        {/* Multi-Filter & Search Bar */}
        <div className="mt-6 flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search Input */}
            <div className="flex flex-1 min-w-[260px] items-center gap-2.5 rounded-control border border-border bg-bg px-3.5 py-2">
              <Search size={16} className="text-ink-faint" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by role, company, or tech stack (e.g. React, Python, Go)…"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-ink-faint hover:text-ink">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setRemoteOnly(!remoteOnly)}
                className={`rounded-control border px-3 py-2 text-xs font-medium transition-colors ${
                  remoteOnly
                    ? "border-teal bg-teal/10 text-teal"
                    : "border-border text-ink-dim hover:text-ink"
                }`}
              >
                🌍 Remote Only
              </button>

              {/* Ghost Risk Filter */}
              <div className="flex items-center gap-2 rounded-control border border-border bg-bg px-3 py-1.5 text-xs text-ink-dim">
                <ShieldCheck size={14} className="text-teal" />
                <span>Max Risk:</span>
                <select
                  value={maxRisk}
                  onChange={(e) => setMaxRisk(Number(e.target.value))}
                  className="bg-transparent text-xs text-ink font-mono font-medium outline-none"
                >
                  <option value={100}>All Listings (0-100)</option>
                  <option value={65}>Verified & Moderate (&lt;65)</option>
                  <option value={30}>Verified Active Only (&lt;30)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Platform Source Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto border-t border-border/60 pt-3">
            <span className="text-xs text-ink-faint shrink-0">Source:</span>
            {SOURCE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setSourceFilter(tab)}
                className={`rounded-control px-2.5 py-1 text-xs capitalize transition-colors shrink-0 ${
                  sourceFilter === tab
                    ? "bg-glass-hover font-semibold text-ink border border-border"
                    : "text-ink-dim hover:text-ink"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="mt-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-ink-dim">
              Showing {filteredJobs.length} live openings
            </p>
            {maxRisk < 100 && (
              <span className="text-xs font-mono text-teal">
                🛡️ Filtered: Only jobs with Ghost Risk &lt; {maxRisk}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center gap-2 text-sm text-ink-faint">
              <Loader2 size={18} className="animate-spin text-teal" />
              Ingesting live jobs…
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border py-20 text-center">
              <Briefcase size={22} className="text-ink-faint" />
              <p className="text-sm font-medium text-ink">No matching jobs found</p>
              <p className="text-xs text-ink-faint">Try adjusting your filters or search keywords.</p>
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setSourceFilter("all");
                  setRemoteOnly(false);
                  setMaxRisk(100);
                }}
                className="mt-2 text-xs"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onExplainGhostScore={(j) => setExplainJob(j)}
                  onSelectJob={(j) => setSelectedJob(j)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Ghost Score Explainability Modal */}
      <GhostScoreExplainModal
        job={explainJob}
        open={Boolean(explainJob)}
        onClose={() => setExplainJob(null)}
      />

      {/* Job Details Drawer */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 p-4"
          onClick={() => setSelectedJob(null)}
        >
          <div
            role="dialog"
            aria-label="Job details"
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-xl flex-col rounded-card border border-border bg-surface p-6 shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-mono text-ink-faint uppercase">{selectedJob.company}</span>
                <h2 className="text-lg font-bold text-ink">{selectedJob.title}</h2>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="rounded-control p-1 text-ink-faint hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-control border border-border px-2.5 py-1 text-ink">
                📍 {selectedJob.location}
              </span>
              {selectedJob.salaryFormatted && (
                <span className="rounded-control border border-teal/30 bg-teal/10 px-2.5 py-1 font-mono text-teal">
                  💰 {selectedJob.salaryFormatted}
                </span>
              )}
              <span className="rounded-control border border-border px-2.5 py-1 text-ink-dim">
                Source: {selectedJob.source}
              </span>
            </div>

            <div className="mt-6 flex-1">
              <h3 className="text-sm font-semibold text-ink">About the Role</h3>
              <p className="mt-2 text-sm text-ink-dim leading-relaxed whitespace-pre-wrap">
                {selectedJob.description}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <button
                onClick={() => setExplainJob(selectedJob)}
                className="text-xs text-teal hover:underline flex items-center gap-1"
              >
                View Anti-Ghost Diagnosis
              </button>

              <a
                href={selectedJob.applyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-control bg-teal px-4 py-2 text-xs font-medium text-black hover:bg-teal/90"
              >
                Apply on {selectedJob.source}
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
