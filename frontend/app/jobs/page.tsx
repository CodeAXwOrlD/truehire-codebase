"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { VerifiedBeaconWordmark } from "@/components/brand/VerifiedBeacon";
import { JobCard } from "@/components/jobs/JobCard";
import { JobDetailsModal } from "@/components/jobs/JobDetailsModal";
import { GhostScoreExplainModal } from "@/components/jobs/GhostScoreExplainModal";
import { MatchScoreModal } from "@/components/jobs/MatchScoreModal";
import { ProfileModal } from "@/components/candidate/ProfileModal";
import { ResumeUploadZone } from "@/components/jobs/ResumeUploadZone";
import { ResumeReviewModal, ResumeTunePreferences } from "@/components/jobs/ResumeReviewModal";
import { UserMenu } from "@/components/ui/UserMenu";
import { JobGridSkeleton } from "@/components/ui/SkeletonCard";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import {
  fetchJobs,
  UnifiedJob,
  JobSource,
  ExperienceLevel,
  JobType,
  ResumeParseResult,
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
  Award,
  Globe,
  Check,
  Clock,
  DollarSign,
  Share2,
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
    experienceYears: 0,
    resumeText: "",
    targetRole: "Software Engineer",
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [resumeZoneOpen, setResumeZoneOpen] = useState(false);

  // Resume Review & Manual Tuning Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [pendingResumeResult, setPendingResumeResult] = useState<ResumeParseResult | null>(null);
  const [activeResumeFilters, setActiveResumeFilters] = useState<ResumeTunePreferences | null>(null);

  // Match score cache
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const matchComputeRef = useRef(false);

  // ── Debounce search ──────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Load profile ─────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const saved = localStorage.getItem("th_candidate_profile");
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch {}

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

  // ── Compute Match Scores ─────────────────────────────────────────────────────

  function scheduleMatchCompute(jobList: UnifiedJob[], skills: string[]) {
    if (matchComputeRef.current || !skills.length || !jobList.length) return;
    matchComputeRef.current = true;

    // Fast client-side keyword matching
    const skillsLower = skills.map((s) => s.toLowerCase());
    const newScores: Record<string, number> = {};

    for (const job of jobList) {
      const jobWords = [
        ...job.tags.map((t) => t.toLowerCase()),
        ...job.title.toLowerCase().split(/\s+/),
        ...job.description.toLowerCase().split(/\s+/),
      ];

      const matchedCount = skillsLower.filter((sk) =>
        jobWords.some((w) => w.includes(sk) || sk.includes(w))
      ).length;

      const ratio = matchedCount / Math.max(1, Math.min(skills.length, 6));
      newScores[job.id] = Math.min(98, Math.max(25, Math.round(ratio * 70 + 28)));
    }

    setMatchScores(newScores);
    matchComputeRef.current = false;
  }

  // ── Real-time SSE Stream ─────────────────────────────────────────────────────

  useEffect(() => {
    let es: EventSource | null = null;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      es = new EventSource(`${apiUrl}/api/jobs/stream`);

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

  // ── Handle resume parsed (Trigger review modal) ──────────────────────────────

  function handleResumeUploaded(result: ResumeParseResult) {
    setPendingResumeResult(result);
    setReviewModalOpen(true);
    setResumeZoneOpen(false);
  }

  function handleApplyResumePreferences(prefs: ResumeTunePreferences) {
    setActiveResumeFilters(prefs);
    const updatedProfile: CandidateProfile = {
      ...profile,
      skills: prefs.selectedSkills,
      targetRole: prefs.targetRole,
      experienceYears:
        prefs.experienceLevel === "entry"
          ? 1
          : prefs.experienceLevel === "mid"
          ? 4
          : prefs.experienceLevel === "senior"
          ? 6
          : 9,
    };
    setProfile(updatedProfile);
    try {
      localStorage.setItem("th_candidate_profile", JSON.stringify(updatedProfile));
    } catch {}

    // Apply as active board filters
    setExpLevel(prefs.experienceLevel);
    setRemoteOnly(prefs.isRemote);
    if (prefs.targetRole && prefs.targetRole !== "Software Engineer") {
      setSearch(prefs.targetRole);
    }

    // Recompute matches with user-confirmed skills
    scheduleMatchCompute(jobs, prefs.selectedSkills);

    // Persist
    updateCandidateProfile({
      skills: updatedProfile.skills,
      experienceYears: updatedProfile.experienceYears,
      targetRole: updatedProfile.targetRole,
    }).catch(() => {});
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
      if (sortMode === "match") {
        return (matchScores[b.id] ?? 0) - (matchScores[a.id] ?? 0);
      }
      if (sortMode === "salary") {
        return (b.salaryMax ?? b.salaryMin ?? 0) - (a.salaryMax ?? a.salaryMin ?? 0);
      }
      if (sortMode === "risk") {
        return a.ghostScore.score - b.ghostScore.score;
      }
      return b.postedAtTs - a.postedAtTs;
    });

  const activeFilterCount =
    (remoteOnly ? 1 : 0) +
    (maxRisk < 100 ? 1 : 0) +
    (expLevel !== "any" ? 1 : 0) +
    (jobType !== "any" ? 1 : 0) +
    (postedWithin > 0 ? 1 : 0);

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800 bg-[#0c0c0f]/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <Link href="/jobs" className="flex items-center gap-2">
            <VerifiedBeaconWordmark />
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-xs">
            <Link
              href="/jobs"
              className="rounded-control bg-glass px-3 py-1.5 font-medium text-white transition-colors"
            >
              Live Jobs
            </Link>
            <Link
              href="/applications"
              className="rounded-control px-3 py-1.5 font-medium text-zinc-400 hover:text-white transition-colors"
            >
              My Applications
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live indicator badge */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-teal/40 bg-teal/10 px-2.5 py-1 text-[11px] font-mono font-bold text-teal">
            <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
            <span>Live · {jobs.length} jobs</span>
          </div>

          {/* Upload Resume Button */}
          <button
            onClick={() => setResumeZoneOpen(!resumeZoneOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-teal/40 bg-teal/10 px-3 py-1.5 text-xs font-semibold text-teal hover:bg-teal/20 transition-all"
          >
            <Upload size={13} />
            <span>Upload CV</span>
          </button>

          {/* Candidate Profile / Skills manager */}
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            <Sparkles size={13} className="text-teal" />
            <span>My Skills ({profile.skills.length})</span>
          </button>

          <UserMenu />
        </div>
      </header>

      {/* ── Collapsible Resume Upload Zone ─────────────────────────────────── */}
      {resumeZoneOpen && (
        <div className="border-b border-zinc-800 bg-[#121217] px-6 py-4">
          <div className="mx-auto max-w-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Upload your resume (PDF or DOCX)</p>
                <p className="text-xs text-zinc-400">
                  Skills are extracted instantly and presented in a tuning modal before filtering
                </p>
              </div>
              <button
                onClick={() => setResumeZoneOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <ResumeUploadZone onParsed={handleResumeUploaded} />
          </div>
        </div>
      )}

      <main className="flex flex-1 flex-col px-6 py-7 max-w-[1400px] mx-auto w-full gap-6">
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Real-Time Verified Tech Jobs
          </h1>
          <p className="text-sm text-zinc-400 max-w-3xl">
            Aggregated live from{" "}
            <span className="text-teal font-semibold">
              Himalayas, Remotive, LinkedIn, Indeed, Y Combinator, RemoteOK, Arbeitnow, Jobicy &amp; The Muse
            </span>
            . Every listing screened by our{" "}
            <span className="text-teal font-semibold">Anti-Ghost</span> &amp;{" "}
            <span className="text-teal font-semibold">AI Match</span> engines.
          </p>
        </div>

        {/* ── Search + Filter Bar ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800/90 bg-[#121217] p-4 shadow-sm">
          {/* Search row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 min-w-[240px] items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 focus-within:border-teal transition-colors">
              <Search size={15} className="text-zinc-400 shrink-0" />
              <input
                id="job-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search role, company, tech stack (e.g. React, Python, Remote)…"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                aria-label="Search jobs"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-zinc-400 hover:text-white shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-300 font-medium">
              <ArrowUpDown size={13} className="text-teal" />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="bg-transparent text-xs text-white outline-none font-medium cursor-pointer"
                aria-label="Sort jobs by"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-zinc-900 text-white">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              aria-expanded={filtersOpen}
              aria-controls="advanced-filters"
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                activeFilterCount > 0 || filtersOpen
                  ? "border-teal bg-teal/15 text-white"
                  : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700"
              }`}
            >
              <Filter size={13} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal text-[10px] font-bold text-black">
                  {activeFilterCount}
                </span>
              )}
              {filtersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {/* Refresh */}
            <button
              onClick={() => loadJobs(true)}
              disabled={refreshing}
              aria-label="Refresh job feed"
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-teal" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Source Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs scrollbar-none border-t border-zinc-800/80 pt-3">
            <span className="shrink-0 text-zinc-500 font-mono text-[11px] mr-1">Source:</span>
            {SOURCE_TABS.map((tab) => {
              const active = sourceFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setSourceFilter(tab.value)}
                  className={`shrink-0 rounded-lg px-3 py-1 font-medium transition-all ${
                    active
                      ? "bg-teal/15 text-white border border-teal font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── Advanced Filters Panel ────────────────────────────────────────── */}
          {filtersOpen && (
            <div
              id="advanced-filters"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border-t border-zinc-800/80 pt-4 text-xs"
            >
              {/* Remote Toggle */}
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                  Location Type
                </label>
                <button
                  onClick={() => setRemoteOnly(!remoteOnly)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition-colors ${
                    remoteOnly
                      ? "border-teal/50 bg-teal/15 text-white font-semibold"
                      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <span>🌍 Remote Only</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      remoteOnly ? "bg-teal" : "bg-zinc-600"
                    }`}
                  />
                </button>
              </div>

              {/* Ghost Risk Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  <span>Max Ghost Risk</span>
                  <span className="font-mono text-teal font-bold">{maxRisk}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={maxRisk}
                  onChange={(e) => setMaxRisk(Number(e.target.value))}
                  className="accent-teal h-2 cursor-pointer mt-1"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>Strict (10)</span>
                  <span>Any (100)</span>
                </div>
              </div>

              {/* Experience Level */}
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                  Experience Level
                </label>
                <select
                  value={expLevel}
                  onChange={(e) => setExpLevel(e.target.value as ExperienceLevel)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="any">Any Experience</option>
                  <option value="entry">Entry Level (0-2y)</option>
                  <option value="mid">Mid Level (3-5y)</option>
                  <option value="senior">Senior Level (5-8y)</option>
                  <option value="lead">Lead / Principal (8y+)</option>
                </select>
              </div>

              {/* Job Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                  Job Type
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as JobType)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="any">All Types</option>
                  <option value="full-time">Full-Time</option>
                  <option value="contract">Contract / Freelance</option>
                  <option value="part-time">Part-Time</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ── Active Resume Filters Banner (If CV tuned) ────────────────────── */}
        {activeResumeFilters && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal/40 bg-teal/10 p-3.5 text-xs text-white shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 font-bold text-teal">
                <Sparkles size={14} />
                Tuned CV Filters:
              </span>
              {activeResumeFilters.targetRole && (
                <span className="rounded-lg border border-teal/30 bg-black/40 px-2.5 py-1 font-medium text-zinc-200">
                  Role: <strong className="text-white">{activeResumeFilters.targetRole}</strong>
                </span>
              )}
              <span className="rounded-lg border border-teal/30 bg-black/40 px-2.5 py-1 font-medium capitalize text-zinc-200">
                Level: <strong className="text-white">{activeResumeFilters.experienceLevel}</strong>
              </span>
              {activeResumeFilters.selectedSkills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1 rounded-lg border border-teal/30 bg-teal/20 px-2.5 py-1 font-mono text-teal font-medium"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => {
                      const nextSkills = activeResumeFilters.selectedSkills.filter((s) => s !== skill);
                      handleApplyResumePreferences({
                        ...activeResumeFilters,
                        selectedSkills: nextSkills,
                      });
                    }}
                    className="hover:text-red-400 transition-colors ml-0.5"
                    title="Remove skill filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="text-teal font-bold hover:underline underline-offset-2"
              >
                Edit Extracted Filters
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveResumeFilters(null);
                  setSearch("");
                  setExpLevel("any");
                }}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        )}

        {/* ── Job Count & Match Banner ──────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-mono">
              <strong className="text-white">{filteredJobs.length}</strong> openings · sorted by{" "}
              {sortMode}
            </span>

            {profile.skills.length > 0 && (
              <span className="text-teal font-mono flex items-center gap-1">
                <Sparkles size={12} />
                Match active · {profile.skills.slice(0, 4).join(", ")}
                {profile.skills.length > 4 && ` +${profile.skills.length - 4}`}
              </span>
            )}
          </div>

          <ErrorBoundary>
            {loading ? (
              <JobGridSkeleton count={9} />
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-20 text-center bg-[#121217]">
                <Briefcase size={24} className="text-zinc-500" />
                <p className="text-sm font-semibold text-white">No matching jobs found</p>
                <p className="text-xs text-zinc-400">
                  Try adjusting your keywords or{" "}
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
                    className="text-teal underline underline-offset-2 font-medium"
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

      {/* ── Executive Centered Job Details Modal ───────────────────────── */}
      <JobDetailsModal
        job={selectedJob}
        open={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        matchScore={selectedJob ? matchScores[selectedJob.id] : undefined}
        onExplainGhostScore={(j) => setExplainJob(j)}
        onExplainMatchScore={handleExplainMatch}
        onSelectTag={(tag) => {
          setSearch(tag);
          setDebouncedSearch(tag);
        }}
      />

      {/* ── Secondary Overlay Modals (Stacked above JobDetailsModal at z-[100]) ── */}
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

      <ResumeReviewModal
        open={reviewModalOpen}
        parseResult={pendingResumeResult}
        onClose={() => setReviewModalOpen(false)}
        onApplyPreferences={handleApplyResumePreferences}
      />
    </div>
  );
}
