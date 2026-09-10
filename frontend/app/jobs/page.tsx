"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { VerifiedBeaconWordmark } from "@/components/brand/VerifiedBeacon";
import { JobCard } from "@/components/jobs/JobCard";
import { GhostScoreExplainModal } from "@/components/jobs/GhostScoreExplainModal";
import { MatchScoreModal } from "@/components/jobs/MatchScoreModal";
import { ProfileModal } from "@/components/candidate/ProfileModal";
import { ResumeUploadZone } from "@/components/jobs/ResumeUploadZone";
import { UserMenu } from "@/components/ui/UserMenu";
import { JobGridSkeleton } from "@/components/ui/SkeletonCard";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import {
  fetchJobs,
  UnifiedJob,
  JobSource,
  ExperienceLevel,
  JobType,
} from "@/lib/api/jobs";
import {
  fetchCandidateProfile,
  calculateJobMatch,
  updateCandidateProfile,
  CandidateProfile,
  MatchScoreResult,
} from "@/lib/api/candidate";
import {
  Search,
  ShieldCheck,
  Briefcase,
  ExternalLink,
  X,
  Loader2,
  Sparkles,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Upload,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

// ── Source Tabs ────────────────────────────────────────────────────────────────

const SOURCE_TABS: { label: string; value: string }[] = [
  { label: "All Sources", value: "all" },
  { label: "Himalayas", value: "himalayas" },
  { label: "Remotive", value: "remotive" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "Indeed", value: "indeed" },
  { label: "Y Combinator", value: "y combinator" },
  { label: "RemoteOK", value: "remoteok" },
  { label: "Arbeitnow", value: "arbeitnow" },
  { label: "Jobicy", value: "jobicy" },
  { label: "The Muse", value: "the muse" },
  { label: "FindWork", value: "findwork" },
];

// ── Sort Options ───────────────────────────────────────────────────────────────

type SortMode = "newest" | "match" | "salary" | "risk";

const SORT_OPTIONS: { label: string; value: SortMode }[] = [
  { label: "Newest First", value: "newest" },
  { label: "Best Match", value: "match" },
  { label: "Highest Salary", value: "salary" },
  { label: "Lowest Risk", value: "risk" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CandidateJobsPage() {
  const [jobs, setJobs] = useState<UnifiedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [maxRisk, setMaxRisk] = useState<number>(100);
  const [expLevel, setExpLevel] = useState<ExperienceLevel>("any");
  const [jobType, setJobType] = useState<JobType>("any");
  const [postedWithin, setPostedWithin] = useState<number>(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  // Job modals
  const [selectedJob, setSelectedJob] = useState<UnifiedJob | null>(null);
  const [explainJob, setExplainJob] = useState<UnifiedJob | null>(null);
  const [activeMatch, setActiveMatch] = useState<{ job: UnifiedJob; match: MatchScoreResult } | null>(null);

  // Profile / Resume
  const [profile, setProfile] = useState<CandidateProfile>({
    userId: "local",
    skills: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL"],
    experienceYears: 3,
    resumeText: "",
    targetRole: "Fullstack Engineer",
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [resumeZoneOpen, setResumeZoneOpen] = useState(false);

  // Match score cache
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const matchComputeRef = useRef(false);

  // ── Debounce search ──────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Load profile ─────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchCandidateProfile().then((res) => {
      if (res.data) setProfile(res.data);
    });
  }, []);

  // ── Load jobs ────────────────────────────────────────────────────────────────

  const loadJobs = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const res = await fetchJobs({
        isRemote: remoteOnly ? true : undefined,
        maxRiskScore: maxRisk < 100 ? maxRisk : undefined,
        source: sourceFilter !== "all" ? sourceFilter : undefined,
        experienceLevel: expLevel !== "any" ? expLevel : undefined,
        jobType: jobType !== "any" ? jobType : undefined,
        postedWithinDays: postedWithin > 0 ? postedWithin : undefined,
      });

      setLoading(false);
      setRefreshing(false);

      if (res.data) {
        setJobs(res.data);
        scheduleMatchCompute(res.data, profile.skills);
      }
    },
    [remoteOnly, maxRisk, sourceFilter, expLevel, jobType, postedWithin, profile.skills]
  );

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // ── Match score computation (background, batched) ─────────────────────────

  const scheduleMatchCompute = useCallback(
    async (jobList: UnifiedJob[], skills: string[]) => {
      if (skills.length === 0) return;
      matchComputeRef.current = true;
      const scores: Record<string, number> = {};

      // Batch in groups of 5 to avoid overwhelming the API
      for (let i = 0; i < Math.min(jobList.length, 30); i++) {
        const j = jobList[i];
        const res = await calculateJobMatch({
          candidateSkills: skills,
          jobTitle: j.title,
          jobTags: j.tags,
          jobDescription: j.description,
        });
        if (res.data) scores[j.id] = res.data.matchPercentage;
      }

      setMatchScores((prev) => ({ ...prev, ...scores }));
      matchComputeRef.current = false;
    },
    []
  );

  // ── SSE live stream ───────────────────────────────────────────────────────────

  useEffect(() => {
    const sseUrl = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/jobs/stream`;
    let es: EventSource | null = null;

    try {
      es = new EventSource(sseUrl);
      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === "NEW_JOB" && payload.job) {
            setJobs((prev) => {
              if (prev.some((j) => j.id === payload.job.id)) return prev;
              return [payload.job, ...prev];
            });
          }
        } catch {}
      };
    } catch {}

    return () => es?.close();
  }, []);

  // ── Handle explain match ──────────────────────────────────────────────────────

  async function handleExplainMatch(job: UnifiedJob) {
    const res = await calculateJobMatch({
      candidateSkills: profile.skills,
      jobTitle: job.title,
      jobTags: job.tags,
      jobDescription: job.description,
    });
    if (res.data) setActiveMatch({ job, match: res.data });
  }

  // ── Handle resume parsed ──────────────────────────────────────────────────────

  function handleResumeParsed(result: {
    skills: string[];
    experienceYears: number;
    detectedRoles: string[];
    summary: string;
    filename: string;
    fileSizeBytes: number;
  }) {
    const updatedProfile: CandidateProfile = {
      ...profile,
      skills: [...new Set([...profile.skills, ...result.skills])],
      experienceYears: result.experienceYears || profile.experienceYears,
      targetRole: result.detectedRoles[0] || profile.targetRole,
    };
    setProfile(updatedProfile);
    setResumeZoneOpen(false);
    // Recompute matches with new skills
    scheduleMatchCompute(jobs, updatedProfile.skills);
    // Persist to backend
    updateCandidateProfile({
      skills: updatedProfile.skills,
      experienceYears: updatedProfile.experienceYears,
      targetRole: updatedProfile.targetRole,
    });
  }

  // ── Client-side filter + sort ─────────────────────────────────────────────

  const filteredJobs = jobs
    .filter((j) => {
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.tags.some((t) => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortMode === "newest") return b.postedAtTs - a.postedAtTs;
      if (sortMode === "match") return (matchScores[b.id] ?? 0) - (matchScores[a.id] ?? 0);
      if (sortMode === "salary") return (b.salaryMax ?? 0) - (a.salaryMax ?? 0);
      if (sortMode === "risk") return a.ghostScore.score - b.ghostScore.score;
      return 0;
    });

  const activeFilterCount = [
    remoteOnly,
    maxRisk < 100,
    expLevel !== "any",
    jobType !== "any",
    postedWithin > 0,
  ].filter(Boolean).length;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* ── Top Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/90 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <VerifiedBeaconWordmark />
          <nav className="hidden md:flex items-center gap-5 text-sm">
            <Link href="/jobs" className="text-teal font-semibold">
              Live Jobs
            </Link>
            <Link href="/applications" className="text-ink-dim hover:text-ink transition-colors">
              My Applications
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live counter badge */}
          <div className="hidden sm:flex items-center gap-2 rounded-control border border-teal/30 bg-teal/5 px-3 py-1 text-xs text-teal font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
            </span>
            <span>Live · {jobs.length} jobs</span>
          </div>

          {/* Resume upload button */}
          <button
            onClick={() => setResumeZoneOpen(!resumeZoneOpen)}
            className="flex items-center gap-1.5 rounded-control border border-border bg-glass px-3 py-1.5 text-xs text-ink hover:border-teal transition-colors"
          >
            <Upload size={13} className="text-teal" />
            <span className="hidden sm:inline">Upload CV</span>
          </button>

          {/* Skills trigger */}
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-1.5 rounded-control border border-border bg-glass px-3 py-1.5 text-xs text-ink hover:border-teal transition-colors"
          >
            <Sparkles size={13} className="text-teal" />
            <span className="hidden sm:inline">My Skills ({profile.skills.length})</span>
          </button>

          <UserMenu onOpenSkills={() => setProfileOpen(true)} />
        </div>
      </header>

      {/* ── Resume Upload Panel (collapsible) ────────────────────────────────── */}
      {resumeZoneOpen && (
        <div className="border-b border-border bg-surface/80 px-6 py-4">
          <div className="mx-auto max-w-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Upload your resume</p>
                <p className="text-xs text-ink-dim">
                  Skills are extracted instantly and jobs are re-ranked by match score
                </p>
              </div>
              <button
                onClick={() => setResumeZoneOpen(false)}
                className="rounded-control p-1.5 text-ink-faint hover:text-ink hover:bg-glass-hover transition-colors"
              >
                <X size={15} />
              </button>
            </div>
            <ResumeUploadZone onParsed={handleResumeParsed} />
          </div>
        </div>
      )}

      <main className="flex flex-1 flex-col px-6 py-7 max-w-[1400px] mx-auto w-full gap-6">
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">
            Real-Time Verified Tech Jobs
          </h1>
          <p className="text-sm text-ink-dim max-w-3xl">
            Aggregated live from{" "}
            <span className="text-teal font-medium">Himalayas, Remotive, LinkedIn, Indeed, Y Combinator, RemoteOK, Arbeitnow, Jobicy & The Muse</span>.
            Every listing screened by our{" "}
            <span className="text-teal font-medium">Anti-Ghost</span> &{" "}
            <span className="text-teal font-medium">AI Match</span> engines.
          </p>
        </div>

        {/* ── Search + Filter Bar ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
          {/* Search row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 min-w-[240px] items-center gap-2.5 rounded-control border border-border bg-bg px-3.5 py-2.5 focus-within:border-teal/50 transition-colors">
              <Search size={15} className="text-ink-faint shrink-0" />
              <input
                id="job-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search role, company, tech stack…"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
                aria-label="Search jobs"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-ink-faint hover:text-ink shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 rounded-control border border-border bg-bg px-3 py-2 text-xs text-ink-dim">
              <ArrowUpDown size={13} className="text-teal" />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="bg-transparent text-xs text-ink outline-none"
                aria-label="Sort jobs by"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              aria-expanded={filtersOpen}
              aria-controls="advanced-filters"
              className={`flex items-center gap-1.5 rounded-control border px-3 py-2 text-xs font-medium transition-colors ${
                activeFilterCount > 0 || filtersOpen
                  ? "border-teal bg-teal/10 text-teal"
                  : "border-border text-ink-dim hover:text-ink"
              }`}
            >
              <Filter size={13} />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal text-[9px] font-bold text-black">
                  {activeFilterCount}
                </span>
              )}
              {filtersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {/* Refresh */}
            <button
              onClick={() => loadJobs(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-control border border-border px-3 py-2 text-xs text-ink-dim hover:text-ink transition-colors disabled:opacity-50"
              aria-label="Refresh job listings"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {/* Advanced filters */}
          {filtersOpen && (
            <div
              id="advanced-filters"
              className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-3"
            >
              {/* Remote toggle */}
              <button
                onClick={() => setRemoteOnly(!remoteOnly)}
                role="switch"
                aria-checked={remoteOnly}
                className={`rounded-control border px-3 py-1.5 text-xs font-medium transition-colors ${
                  remoteOnly
                    ? "border-teal bg-teal/10 text-teal"
                    : "border-border text-ink-dim hover:text-ink"
                }`}
              >
                🌍 Remote Only
              </button>

              {/* Max Ghost Risk */}
              <div className="flex items-center gap-2 rounded-control border border-border bg-bg px-3 py-1.5 text-xs text-ink-dim">
                <ShieldCheck size={13} className="text-teal" />
                <span>Max Risk:</span>
                <select
                  value={maxRisk}
                  onChange={(e) => setMaxRisk(Number(e.target.value))}
                  className="bg-transparent text-xs text-ink outline-none"
                  aria-label="Maximum ghost risk score"
                >
                  <option value={100}>Any Risk</option>
                  <option value={65}>Verified (&lt;65)</option>
                  <option value={30}>Active Only (&lt;30)</option>
                </select>
              </div>

              {/* Experience Level */}
              <div className="flex items-center gap-2 rounded-control border border-border bg-bg px-3 py-1.5 text-xs text-ink-dim">
                <span>Experience:</span>
                <select
                  value={expLevel}
                  onChange={(e) => setExpLevel(e.target.value as ExperienceLevel)}
                  className="bg-transparent text-xs text-ink outline-none"
                  aria-label="Filter by experience level"
                >
                  <option value="any">Any Level</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead / Staff</option>
                </select>
              </div>

              {/* Job Type */}
              <div className="flex items-center gap-2 rounded-control border border-border bg-bg px-3 py-1.5 text-xs text-ink-dim">
                <span>Type:</span>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as JobType)}
                  className="bg-transparent text-xs text-ink outline-none"
                  aria-label="Filter by job type"
                >
                  <option value="any">Any Type</option>
                  <option value="full-time">Full-Time</option>
                  <option value="contract">Contract</option>
                  <option value="part-time">Part-Time</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              {/* Posted Within */}
              <div className="flex items-center gap-2 rounded-control border border-border bg-bg px-3 py-1.5 text-xs text-ink-dim">
                <span>Posted:</span>
                <select
                  value={postedWithin}
                  onChange={(e) => setPostedWithin(Number(e.target.value))}
                  className="bg-transparent text-xs text-ink outline-none"
                  aria-label="Filter by posting date"
                >
                  <option value={0}>Any Time</option>
                  <option value={1}>Today</option>
                  <option value={3}>Last 3 Days</option>
                  <option value={7}>This Week</option>
                  <option value={30}>This Month</option>
                </select>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setRemoteOnly(false);
                    setMaxRisk(100);
                    setExpLevel("any");
                    setJobType("any");
                    setPostedWithin(0);
                  }}
                  className="text-xs text-red hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Source tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border/60 pt-3 scrollbar-hide">
            <span className="text-xs text-ink-faint shrink-0">Source:</span>
            {SOURCE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSourceFilter(tab.value)}
                className={`rounded-control px-2.5 py-1 text-xs capitalize transition-colors shrink-0 whitespace-nowrap ${
                  sourceFilter === tab.value
                    ? "bg-teal/10 border border-teal/30 font-semibold text-teal"
                    : "text-ink-dim hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Jobs Grid ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-ink-dim">
              {loading ? "Loading…" : `${filteredJobs.length} openings`}
              {filteredJobs.length > 0 && !loading && (
                <span className="ml-2 text-ink-faint">· sorted by {sortMode.replace("-", " ")}</span>
              )}
            </p>
            {profile.skills.length > 0 && (
              <span className="text-xs font-mono text-teal flex items-center gap-1">
                <Sparkles size={12} />
                Match active · {profile.skills.slice(0, 3).join(", ")}
                {profile.skills.length > 3 && ` +${profile.skills.length - 3}`}
              </span>
            )}
          </div>

          <ErrorBoundary>
            {loading ? (
              <JobGridSkeleton count={9} />
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border py-20 text-center">
                <Briefcase size={22} className="text-ink-faint" />
                <p className="text-sm font-medium text-ink">No matching jobs found</p>
                <p className="text-xs text-ink-faint">
                  Try adjusting your filters or{" "}
                  <button
                    onClick={() => {
                      setSearch("");
                      setSourceFilter("all");
                      setRemoteOnly(false);
                      setMaxRisk(100);
                      setExpLevel("any");
                      setJobType("any");
                      setPostedWithin(0);
                    }}
                    className="text-teal underline underline-offset-2"
                  >
                    clear all filters
                  </button>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    matchScore={matchScores[job.id]}
                    onExplainGhostScore={(j) => setExplainJob(j)}
                    onExplainMatchScore={handleExplainMatch}
                    onSelectJob={(j) => setSelectedJob(j)}
                  />
                ))}
              </div>
            )}
          </ErrorBoundary>
        </div>
      </main>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}

      <GhostScoreExplainModal
        job={explainJob}
        open={Boolean(explainJob)}
        onClose={() => setExplainJob(null)}
      />

      <MatchScoreModal
        job={activeMatch?.job || null}
        match={activeMatch?.match || null}
        open={Boolean(activeMatch)}
        onClose={() => setActiveMatch(null)}
      />

      <ProfileModal
        profile={profile}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSaved={(p) => {
          setProfile(p);
          scheduleMatchCompute(jobs, p.skills);
        }}
      />

      {/* ── Job Detail Drawer ─────────────────────────────────────────────── */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 p-4"
          onClick={() => setSelectedJob(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-drawer-title"
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-xl flex-col rounded-card border border-border bg-surface p-6 shadow-2xl overflow-y-auto"
          >
            {/* Drawer header */}
            <div className="flex items-start justify-between border-b border-border pb-4 gap-3">
              <div className="flex items-start gap-3">
                {selectedJob.companyLogo && (
                  <img
                    src={selectedJob.companyLogo}
                    alt={selectedJob.company}
                    className="h-10 w-10 rounded-lg border border-border object-contain bg-bg p-0.5 shrink-0"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                )}
                <div>
                  <span className="text-xs font-mono text-ink-faint uppercase tracking-wider">
                    {selectedJob.company}
                  </span>
                  <h2
                    id="job-drawer-title"
                    className="text-lg font-bold text-ink leading-tight"
                  >
                    {selectedJob.title}
                  </h2>
                  <div className="mt-1 flex items-center gap-2 text-xs text-ink-faint">
                    <span>{selectedJob.location}</span>
                    <span>·</span>
                    <span>{timeAgo(selectedJob.postedAt)}</span>
                    {selectedJob.experienceLevel !== "any" && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{selectedJob.experienceLevel}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="rounded-control p-1.5 text-ink-faint hover:text-ink hover:bg-glass-hover transition-colors shrink-0"
                aria-label="Close job details"
              >
                <X size={17} />
              </button>
            </div>

            {/* Badges */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-control border border-border px-2.5 py-1 text-ink">
                📍 {selectedJob.location}
              </span>
              {selectedJob.salaryFormatted && (
                <span className="rounded-control border border-teal/30 bg-teal/10 px-2.5 py-1 font-mono text-teal">
                  💰 {selectedJob.salaryFormatted}
                </span>
              )}
              {selectedJob.jobType !== "full-time" && selectedJob.jobType !== "any" && (
                <span className="rounded-control border border-amber/30 bg-amber/10 px-2.5 py-1 font-mono text-amber capitalize">
                  {selectedJob.jobType}
                </span>
              )}
              {selectedJob.isRemote && (
                <span className="rounded-control border border-border px-2.5 py-1 text-ink-dim">
                  🌍 Remote
                </span>
              )}
              {matchScores[selectedJob.id] && (
                <span className="rounded-control border border-teal/40 bg-teal/10 px-2.5 py-1 font-mono text-teal flex items-center gap-1">
                  <Sparkles size={11} />
                  {matchScores[selectedJob.id]}% Match
                </span>
              )}
            </div>

            {/* Tags */}
            {selectedJob.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {selectedJob.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-control bg-glass border border-border px-2 py-0.5 text-xs text-ink-dim"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mt-6 flex-1">
              <h3 className="text-sm font-semibold text-ink">About the Role</h3>
              <p className="mt-2 text-sm text-ink-dim leading-relaxed whitespace-pre-wrap">
                {selectedJob.description}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4 gap-3">
              <button
                onClick={() => {
                  setSelectedJob(null);
                  setExplainJob(selectedJob);
                }}
                className="text-xs text-teal hover:underline underline-offset-2 flex items-center gap-1"
              >
                <ShieldCheck size={13} />
                Anti-Ghost Diagnosis
              </button>

              <a
                href={selectedJob.applyUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-control bg-teal px-4 py-2 text-xs font-semibold text-black hover:bg-teal/90 transition-colors"
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
