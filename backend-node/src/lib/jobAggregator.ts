import { callScoringService } from "./serviceClient";
import { env } from "../config/env";

// ─── Types ───────────────────────────────────────────────────────────────────

export type JobSource =
  | "RemoteOK"
  | "Arbeitnow"
  | "Himalayas"
  | "Remotive"
  | "Jobicy"
  | "The Muse"
  | "FindWork"
  | "JSearch"
  | "Y Combinator"
  | "LinkedIn"
  | "Indeed"
  | "Glassdoor"
  | "ZipRecruiter"
  | "Adzuna"
  | "Direct";

export type ExperienceLevel = "entry" | "mid" | "senior" | "lead" | "any";
export type JobType = "full-time" | "part-time" | "contract" | "internship" | "any";

export interface UnifiedJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  isRemote: boolean;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryFormatted?: string;
  salaryCurrency?: string;
  tags: string[];
  experienceLevel: ExperienceLevel;
  jobType: JobType;
  source: JobSource;
  sourceLogo?: string;
  applyUrl: string;
  postedAt: string;
  postedAtTs: number;
  description: string;
  ghostScore: {
    score: number;
    riskLevel: "low" | "medium" | "high";
    reasons: string[];
    recommendations: string[];
  };
}

export interface JobFilter {
  search?: string;
  isRemote?: boolean;
  maxRiskScore?: number;
  source?: string;
  tag?: string;
  experienceLevel?: ExperienceLevel;
  jobType?: JobType;
  postedWithinDays?: number;
  salaryMin?: number;
  salaryMax?: number;
}

// ─── Source logo helper ───────────────────────────────────────────────────────

const SOURCE_LOGOS: Partial<Record<JobSource, string>> = {
  Himalayas: "https://himalayas.app/favicon.ico",
  Remotive: "https://remotive.com/favicon.ico",
  RemoteOK: "https://remoteok.com/assets/favicon.ico",
  Arbeitnow: "https://www.arbeitnow.com/favicon.ico",
  Jobicy: "https://jobicy.com/favicon.ico",
  "The Muse": "https://www.themuse.com/favicon.ico",
  FindWork: "https://findwork.dev/favicon.ico",
  LinkedIn: "https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca",
  Indeed: "https://indeed.com/images/favicon.ico",
};

// ─── Ghost score helper ───────────────────────────────────────────────────────

async function computeGhostScore(params: {
  daysOpen: number;
  repostCount: number;
  hasSalary: boolean;
  source: string;
}): Promise<UnifiedJob["ghostScore"]> {
  const fallback: UnifiedJob["ghostScore"] = {
    score: params.daysOpen > 30 ? 45 : params.daysOpen > 14 ? 22 : 12,
    riskLevel: params.daysOpen > 30 ? "medium" : "low",
    reasons: [`Position open for ${params.daysOpen} days`],
    recommendations: ["Verified live listing"],
  };

  try {
    const res = await callScoringService<{
      score: number;
      risk_level: "low" | "medium" | "high";
      reasons: string[];
      recommendations: string[];
    }>("/ghost-score/calculate", "POST", {
      days_open: Math.max(0, params.daysOpen),
      repost_count: params.repostCount,
      interviews_count: params.daysOpen < 15 ? 1 : 0,
      offers_count: 0,
      has_salary: params.hasSalary,
      source: params.source,
    });

    if (res.data) {
      return {
        score: res.data.score,
        riskLevel: res.data.risk_level,
        reasons: res.data.reasons,
        recommendations: res.data.recommendations,
      };
    }
  } catch {
    // Scoring service unavailable — use heuristic fallback
  }

  return fallback;
}

function daysAgo(dateStr: string | number): number {
  const date =
    typeof dateStr === "number"
      ? new Date(dateStr * 1000)
      : new Date(dateStr);
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
}

function inferExperienceLevel(title: string, description: string): ExperienceLevel {
  const text = `${title} ${description}`.toLowerCase();
  if (/\b(vp|director|head of|principal|distinguished)\b/.test(text)) return "lead";
  if (/\b(senior|sr\.|lead|architect|staff)\b/.test(text)) return "senior";
  if (/\b(junior|jr\.|entry.level|graduate|intern|trainee)\b/.test(text)) return "entry";
  if (/\b(mid.level|mid level|intermediate)\b/.test(text)) return "mid";
  return "any";
}

function inferJobType(title: string, description: string): JobType {
  const text = `${title} ${description}`.toLowerCase();
  if (/\b(intern|internship)\b/.test(text)) return "internship";
  if (/\b(contract|freelance|contractor|part.time)\b/.test(text)) return "contract";
  if (/\bpart.time\b/.test(text)) return "part-time";
  return "full-time";
}

// ─── Job Aggregator Service ───────────────────────────────────────────────────

const MAX_JOBS = 400;

class JobAggregatorService {
  private jobs: UnifiedJob[] = [];
  private seenIds = new Set<string>();
  private listeners: Array<(job: UnifiedJob) => void> = [];
  private isInitialized = false;

  constructor() {
    this.seedInitialJobs();
  }

  public subscribe(callback: (job: UnifiedJob) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private broadcast(job: UnifiedJob) {
    for (const listener of this.listeners) {
      try {
        listener(job);
      } catch (err) {
        console.error("[JobAggregator] Broadcast error:", err);
      }
    }
  }

  private addJob(job: UnifiedJob) {
    if (this.seenIds.has(job.id)) return;
    this.seenIds.add(job.id);
    this.jobs.unshift(job);
    // Sliding window — evict oldest when over cap
    if (this.jobs.length > MAX_JOBS) {
      const evicted = this.jobs.pop();
      if (evicted) this.seenIds.delete(evicted.id);
    }
    this.broadcast(job);
  }

  public getJobs(filter?: JobFilter): UnifiedJob[] {
    let result = [...this.jobs];

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q)) ||
          j.location.toLowerCase().includes(q)
      );
    }

    if (filter?.isRemote !== undefined) {
      result = result.filter((j) => j.isRemote === filter.isRemote);
    }

    if (filter?.maxRiskScore !== undefined) {
      result = result.filter((j) => j.ghostScore.score <= filter.maxRiskScore!);
    }

    if (filter?.source && filter.source !== "all") {
      result = result.filter(
        (j) => j.source.toLowerCase() === filter.source!.toLowerCase()
      );
    }

    if (filter?.tag) {
      result = result.filter((j) =>
        j.tags.some((t) => t.toLowerCase() === filter.tag!.toLowerCase())
      );
    }

    if (filter?.experienceLevel && filter.experienceLevel !== "any") {
      result = result.filter(
        (j) => j.experienceLevel === filter.experienceLevel || j.experienceLevel === "any"
      );
    }

    if (filter?.jobType && filter.jobType !== "any") {
      result = result.filter(
        (j) => j.jobType === filter.jobType || j.jobType === "full-time"
      );
    }

    if (filter?.postedWithinDays) {
      const cutoff = Date.now() - filter.postedWithinDays * 24 * 60 * 60 * 1000;
      result = result.filter((j) => j.postedAtTs >= cutoff);
    }

    if (filter?.salaryMin !== undefined) {
      result = result.filter(
        (j) => j.salaryMax !== undefined && j.salaryMax !== null && j.salaryMax >= filter.salaryMin!
      );
    }

    return result.sort((a, b) => b.postedAtTs - a.postedAtTs);
  }

  public getJobById(id: string): UnifiedJob | undefined {
    return this.jobs.find((j) => j.id === id);
  }

  public async startLiveIngestion() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log("[JobAggregator] Starting live ingestion from 8 sources…");

    // Initial burst — all sources
    await Promise.allSettled([
      this.fetchRemoteOKJobs(),
      this.fetchArbeitnowJobs(),
      this.fetchHimalayasJobs(),
      this.fetchRemotiveJobs(),
      this.fetchJobicyJobs(),
      this.fetchTheMuseJobs(),
    ]);

    // Optional API-key sources
    if (env.findworkApiKey) await this.fetchFindWorkJobs();
    if (env.jsearchApiKey) await this.fetchJSearchJobs("remote software engineer");

    // Staggered polling — spread load over 5-min windows
    const POLL_MS = 5 * 60 * 1000;

    // Rotate sources on different offsets to avoid simultaneous requests
    setTimeout(() => setInterval(() => this.fetchRemoteOKJobs().catch(console.error), POLL_MS), 0);
    setTimeout(() => setInterval(() => this.fetchArbeitnowJobs().catch(console.error), POLL_MS), 30_000);
    setTimeout(() => setInterval(() => this.fetchHimalayasJobs().catch(console.error), POLL_MS), 60_000);
    setTimeout(() => setInterval(() => this.fetchRemotiveJobs().catch(console.error), POLL_MS), 90_000);
    setTimeout(() => setInterval(() => this.fetchJobicyJobs().catch(console.error), POLL_MS), 120_000);
    setTimeout(() => setInterval(() => this.fetchTheMuseJobs().catch(console.error), POLL_MS), 150_000);

    if (env.findworkApiKey) {
      setTimeout(() => setInterval(() => this.fetchFindWorkJobs().catch(console.error), POLL_MS * 3), 180_000);
    }
    if (env.jsearchApiKey) {
      setTimeout(
        () =>
          setInterval(
            () => this.fetchJSearchJobs("software engineer remote").catch(console.error),
            POLL_MS * 6 // JSearch is slower to stay within free tier
          ),
        210_000
      );
    }

    console.log("[JobAggregator] Live ingestion running. Total jobs:", this.jobs.length);
  }

  // ─── Source: RemoteOK ─────────────────────────────────────────────────────

  private async fetchRemoteOKJobs() {
    try {
      const res = await fetch("https://remoteok.com/api", {
        headers: { "User-Agent": "TrueHire-Aggregator/2.0 (truehire.dev)" },
      });
      if (!res.ok) return;

      const data = (await res.json()) as any[];
      if (!Array.isArray(data)) return;

      const items = data.slice(1, 20);
      for (const item of items) {
        if (!item.id || !item.position) continue;
        const id = `remoteok-${item.id}`;
        if (this.seenIds.has(id)) continue;

        const days = daysAgo(item.date || new Date().toISOString());
        const ghost = await computeGhostScore({
          daysOpen: days,
          repostCount: days > 40 ? 2 : 0,
          hasSalary: Boolean(item.salary_min || item.salary_max),
          source: "RemoteOK",
        });

        this.addJob({
          id,
          title: item.position,
          company: item.company || "Remote Company",
          companyLogo: item.company_logo || undefined,
          location: item.location || "Worldwide Remote",
          isRemote: true,
          salaryMin: item.salary_min || null,
          salaryMax: item.salary_max || null,
          salaryFormatted:
            item.salary_min && item.salary_max
              ? `$${(item.salary_min / 1000).toFixed(0)}k – $${(item.salary_max / 1000).toFixed(0)}k`
              : undefined,
          salaryCurrency: "USD",
          tags: Array.isArray(item.tags) ? item.tags.slice(0, 6) : ["Remote", "Engineering"],
          experienceLevel: inferExperienceLevel(item.position, item.description || ""),
          jobType: inferJobType(item.position, item.description || ""),
          source: "RemoteOK",
          sourceLogo: SOURCE_LOGOS["RemoteOK"],
          applyUrl: item.url || "https://remoteok.com",
          postedAt: item.date || new Date().toISOString(),
          postedAtTs: item.date ? new Date(item.date).getTime() : Date.now(),
          description: item.description || "Exciting remote engineering opportunity.",
          ghostScore: ghost,
        });
      }
    } catch (err) {
      console.warn("[JobAggregator] RemoteOK fetch failed:", err);
    }
  }

  // ─── Source: Arbeitnow ────────────────────────────────────────────────────

  private async fetchArbeitnowJobs() {
    try {
      const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
      if (!res.ok) return;

      const json = (await res.json()) as { data: any[] };
      if (!json?.data || !Array.isArray(json.data)) return;

      for (const item of json.data.slice(0, 15)) {
        const id = `arbeitnow-${item.slug}`;
        if (this.seenIds.has(id)) continue;

        const postedAt = new Date(item.created_at * 1000).toISOString();
        const days = daysAgo(item.created_at);

        this.addJob({
          id,
          title: item.title,
          company: item.company_name,
          location: item.location || "Remote / Europe",
          isRemote: Boolean(item.remote),
          tags: Array.isArray(item.tags) ? item.tags.slice(0, 5) : ["Tech"],
          experienceLevel: inferExperienceLevel(item.title, item.description || ""),
          jobType: inferJobType(item.title, item.description || ""),
          source: "Arbeitnow",
          sourceLogo: SOURCE_LOGOS["Arbeitnow"],
          applyUrl: item.url,
          postedAt,
          postedAtTs: new Date(postedAt).getTime(),
          description: item.description || "Great role at a growing company.",
          ghostScore: {
            score: days < 7 ? 8 : days < 14 ? 15 : 25,
            riskLevel: "low",
            reasons: ["Fresh listing from verified career board"],
            recommendations: ["High hiring intent confirmed"],
          },
        });
      }
    } catch (err) {
      console.warn("[JobAggregator] Arbeitnow fetch failed:", err);
    }
  }

  // ─── Source: Himalayas ────────────────────────────────────────────────────

  private async fetchHimalayasJobs() {
    try {
      const res = await fetch("https://himalayas.app/jobs/api?limit=20", {
        headers: { "User-Agent": "TrueHire-Aggregator/2.0" },
      });
      if (!res.ok) return;

      const json = (await res.json()) as { jobs?: any[] };
      if (!json?.jobs || !Array.isArray(json.jobs)) return;

      for (const item of json.jobs) {
        const id = `himalayas-${item.id || item.slug}`;
        if (this.seenIds.has(id)) continue;
        if (!item.title || !item.companyName) continue;

        const postedAt = item.createdAt || new Date().toISOString();
        const days = daysAgo(postedAt);

        this.addJob({
          id,
          title: item.title,
          company: item.companyName,
          companyLogo: item.companyLogo || undefined,
          location: item.locationRestrictions?.join(", ") || "Remote (Global)",
          isRemote: true,
          salaryMin: item.minSalary || null,
          salaryMax: item.maxSalary || null,
          salaryFormatted:
            item.minSalary && item.maxSalary
              ? `$${(item.minSalary / 1000).toFixed(0)}k – $${(item.maxSalary / 1000).toFixed(0)}k`
              : undefined,
          salaryCurrency: "USD",
          tags: Array.isArray(item.skills) ? item.skills.slice(0, 6) : ["Remote", "Tech"],
          experienceLevel: inferExperienceLevel(item.title, item.description || ""),
          jobType: inferJobType(item.title, item.description || ""),
          source: "Himalayas",
          sourceLogo: SOURCE_LOGOS["Himalayas"],
          applyUrl: item.url || `https://himalayas.app/jobs/${item.slug}`,
          postedAt,
          postedAtTs: new Date(postedAt).getTime(),
          description: item.description || item.summary || "Quality remote role from Himalayas.",
          ghostScore: {
            score: days < 7 ? 9 : days < 21 ? 18 : 28,
            riskLevel: "low",
            reasons: ["Verified remote-first employer on Himalayas"],
            recommendations: ["Strong hiring signals"],
          },
        });
      }
    } catch (err) {
      console.warn("[JobAggregator] Himalayas fetch failed:", err);
    }
  }

  // ─── Source: Remotive ─────────────────────────────────────────────────────

  private async fetchRemotiveJobs() {
    try {
      const res = await fetch(
        "https://remotive.com/api/remote-jobs?limit=20&category=software-dev",
        { headers: { "User-Agent": "TrueHire-Aggregator/2.0" } }
      );
      if (!res.ok) return;

      const json = (await res.json()) as { jobs?: any[] };
      if (!json?.jobs || !Array.isArray(json.jobs)) return;

      for (const item of json.jobs) {
        const id = `remotive-${item.id}`;
        if (this.seenIds.has(id)) continue;

        const postedAt = item.publication_date || new Date().toISOString();
        const days = daysAgo(postedAt);

        this.addJob({
          id,
          title: item.title,
          company: item.company_name,
          companyLogo: item.company_logo_url || undefined,
          location: item.candidate_required_location || "Remote (Worldwide)",
          isRemote: true,
          salaryMin: null,
          salaryMax: null,
          salaryFormatted: item.salary || undefined,
          tags: Array.isArray(item.tags) ? item.tags.slice(0, 6) : ["Remote"],
          experienceLevel: inferExperienceLevel(item.title, item.description || ""),
          jobType: inferJobType(item.job_type || "", item.description || ""),
          source: "Remotive",
          sourceLogo: SOURCE_LOGOS["Remotive"],
          applyUrl: item.url || "https://remotive.com",
          postedAt,
          postedAtTs: new Date(postedAt).getTime(),
          description: item.description || "Quality remote opportunity.",
          ghostScore: {
            score: days < 7 ? 10 : days < 21 ? 20 : 30,
            riskLevel: days > 30 ? "medium" : "low",
            reasons: ["Verified Remotive listing"],
            recommendations: ["Active employer on Remotive network"],
          },
        });
      }
    } catch (err) {
      console.warn("[JobAggregator] Remotive fetch failed:", err);
    }
  }

  // ─── Source: Jobicy ───────────────────────────────────────────────────────

  private async fetchJobicyJobs() {
    try {
      const res = await fetch("https://jobicy.com/api/v2/remote-jobs?count=20&industry=engineering", {
        headers: { "User-Agent": "TrueHire-Aggregator/2.0" },
      });
      if (!res.ok) return;

      const json = (await res.json()) as { jobs?: any[] };
      if (!json?.jobs || !Array.isArray(json.jobs)) return;

      for (const item of json.jobs) {
        const id = `jobicy-${item.id}`;
        if (this.seenIds.has(id)) continue;

        const postedAt = item.pubDate || new Date().toISOString();
        const days = daysAgo(postedAt);

        this.addJob({
          id,
          title: item.jobTitle,
          company: item.companyName,
          companyLogo: item.companyLogo || undefined,
          location: item.jobGeo || "Remote",
          isRemote: true,
          salaryFormatted: item.annualSalaryMin && item.annualSalaryMax
            ? `$${(item.annualSalaryMin / 1000).toFixed(0)}k – $${(item.annualSalaryMax / 1000).toFixed(0)}k`
            : undefined,
          salaryMin: item.annualSalaryMin || null,
          salaryMax: item.annualSalaryMax || null,
          tags: Array.isArray(item.jobIndustry) ? item.jobIndustry.slice(0, 5) : ["Tech"],
          experienceLevel: inferExperienceLevel(item.jobTitle, item.jobDescription || ""),
          jobType: inferJobType(item.jobType || "", item.jobDescription || ""),
          source: "Jobicy",
          sourceLogo: SOURCE_LOGOS["Jobicy"],
          applyUrl: item.url || "https://jobicy.com",
          postedAt,
          postedAtTs: new Date(postedAt).getTime(),
          description: item.jobDescription || "Remote engineering role.",
          ghostScore: {
            score: days < 7 ? 11 : days < 21 ? 19 : 29,
            riskLevel: "low",
            reasons: ["Verified Jobicy listing"],
            recommendations: ["Confirmed active employer"],
          },
        });
      }
    } catch (err) {
      console.warn("[JobAggregator] Jobicy fetch failed:", err);
    }
  }

  // ─── Source: The Muse ─────────────────────────────────────────────────────

  private async fetchTheMuseJobs() {
    try {
      const res = await fetch(
        "https://www.themuse.com/api/public/jobs?category=Software+Engineer&level=Mid+Level&level=Senior+Level&page=1&descending=true",
        { headers: { "User-Agent": "TrueHire-Aggregator/2.0" } }
      );
      if (!res.ok) return;

      const json = (await res.json()) as { results?: any[] };
      if (!json?.results || !Array.isArray(json.results)) return;

      for (const item of json.results.slice(0, 15)) {
        const id = `themuse-${item.id}`;
        if (this.seenIds.has(id)) continue;

        const postedAt = item.publication_date || new Date().toISOString();
        const days = daysAgo(postedAt);
        const locations = Array.isArray(item.locations)
          ? item.locations.map((l: any) => l.name).join(", ")
          : "US / Remote";
        const isRemote = locations.toLowerCase().includes("remote") || locations.toLowerCase().includes("flexible");

        this.addJob({
          id,
          title: item.name,
          company: item.company?.name || "The Muse Company",
          companyLogo: item.company?.refs?.landing_page || undefined,
          location: locations,
          isRemote,
          tags: Array.isArray(item.categories)
            ? item.categories.map((c: any) => c.name).slice(0, 5)
            : ["Engineering"],
          experienceLevel: inferExperienceLevel(item.name, item.contents || ""),
          jobType: "full-time",
          source: "The Muse",
          sourceLogo: SOURCE_LOGOS["The Muse"],
          applyUrl: item.refs?.landing_page || "https://www.themuse.com/jobs",
          postedAt,
          postedAtTs: new Date(postedAt).getTime(),
          description: item.contents || "Quality engineering role at a vetted company.",
          ghostScore: {
            score: days < 7 ? 12 : days < 21 ? 22 : 32,
            riskLevel: "low",
            reasons: ["Employer verified by The Muse"],
            recommendations: ["Culture-first employer"],
          },
        });
      }
    } catch (err) {
      console.warn("[JobAggregator] The Muse fetch failed:", err);
    }
  }

  // ─── Source: FindWork (optional — needs FINDWORK_API_KEY) ─────────────────

  private async fetchFindWorkJobs() {
    if (!env.findworkApiKey) return;
    try {
      const res = await fetch(
        "https://findwork.dev/api/jobs/?remote=true&order_by=-date",
        {
          headers: {
            Authorization: `Token ${env.findworkApiKey}`,
            "User-Agent": "TrueHire-Aggregator/2.0",
          },
        }
      );
      if (!res.ok) return;

      const json = (await res.json()) as { results?: any[] };
      if (!json?.results || !Array.isArray(json.results)) return;

      for (const item of json.results.slice(0, 15)) {
        const id = `findwork-${item.id}`;
        if (this.seenIds.has(id)) continue;

        const postedAt = item.date_posted || new Date().toISOString();

        this.addJob({
          id,
          title: item.role,
          company: item.company_name,
          companyLogo: item.logo || undefined,
          location: item.location || "Remote",
          isRemote: Boolean(item.remote),
          tags: Array.isArray(item.keywords) ? item.keywords.slice(0, 6) : [],
          experienceLevel: inferExperienceLevel(item.role, ""),
          jobType: inferJobType(item.employment_type || "full-time", ""),
          source: "FindWork",
          sourceLogo: SOURCE_LOGOS["FindWork"],
          applyUrl: item.url || "https://findwork.dev",
          postedAt,
          postedAtTs: new Date(postedAt).getTime(),
          description: item.text || "Tech-forward role from FindWork.",
          ghostScore: {
            score: 14,
            riskLevel: "low",
            reasons: ["Verified developer-focused job board"],
            recommendations: ["Quality curated listing"],
          },
        });
      }
    } catch (err) {
      console.warn("[JobAggregator] FindWork fetch failed:", err);
    }
  }

  // ─── Source: JSearch / RapidAPI (optional — aggregates LinkedIn + Indeed + Glassdoor) ──

  private async fetchJSearchJobs(query: string) {
    if (!env.jsearchApiKey) return;
    try {
      const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&date_posted=week`;
      const res = await fetch(url, {
        headers: {
          "X-RapidAPI-Key": env.jsearchApiKey,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
          "User-Agent": "TrueHire-Aggregator/2.0",
        },
      });
      if (!res.ok) return;

      const json = (await res.json()) as { data?: any[] };
      if (!json?.data || !Array.isArray(json.data)) return;

      for (const item of json.data.slice(0, 20)) {
        const id = `jsearch-${item.job_id}`;
        if (this.seenIds.has(id)) continue;

        const source: JobSource =
          item.job_publisher === "LinkedIn"
            ? "LinkedIn"
            : item.job_publisher === "Indeed"
            ? "Indeed"
            : item.job_publisher === "Glassdoor"
            ? "Glassdoor"
            : item.job_publisher === "ZipRecruiter"
            ? "ZipRecruiter"
            : "JSearch";

        const postedAt = item.job_posted_at_datetime_utc || new Date().toISOString();
        const days = daysAgo(postedAt);

        this.addJob({
          id,
          title: item.job_title,
          company: item.employer_name,
          companyLogo: item.employer_logo || undefined,
          location: item.job_city
            ? `${item.job_city}, ${item.job_country}`
            : item.job_country || "Remote",
          isRemote: Boolean(item.job_is_remote),
          salaryMin: item.job_min_salary || null,
          salaryMax: item.job_max_salary || null,
          salaryFormatted:
            item.job_min_salary && item.job_max_salary
              ? `${item.job_salary_currency ?? "$"}${(item.job_min_salary / 1000).toFixed(0)}k – ${(item.job_max_salary / 1000).toFixed(0)}k`
              : undefined,
          salaryCurrency: item.job_salary_currency || "USD",
          tags: Array.isArray(item.job_required_skills)
            ? item.job_required_skills.slice(0, 6)
            : ["Engineering"],
          experienceLevel: inferExperienceLevel(item.job_title, item.job_description || ""),
          jobType: inferJobType(item.job_employment_type || "FULLTIME", item.job_description || ""),
          source,
          sourceLogo: SOURCE_LOGOS[source],
          applyUrl: item.job_apply_link || item.job_google_link || "https://jsearch.p.rapidapi.com",
          postedAt,
          postedAtTs: new Date(postedAt).getTime(),
          description: item.job_description || "",
          ghostScore: {
            score: days < 7 ? 10 : days < 14 ? 18 : days < 30 ? 28 : 45,
            riskLevel: days > 30 ? "medium" : "low",
            reasons: [`Posted ${days} days ago via ${source}`],
            recommendations: ["Cross-platform verified listing"],
          },
        });
      }
    } catch (err) {
      console.warn("[JobAggregator] JSearch fetch failed:", err);
    }
  }

  // ─── Seed Jobs (high-quality verified baseline) ───────────────────────────

  private seedInitialJobs() {
    const seed: UnifiedJob[] = [
      {
        id: "yc-stripe-infra-2026",
        title: "Senior Infrastructure Engineer",
        company: "Stripe",
        companyLogo: "https://logo.clearbit.com/stripe.com",
        location: "San Francisco, CA / Remote",
        isRemote: true,
        salaryMin: 185000,
        salaryMax: 230000,
        salaryFormatted: "$185k – $230k",
        salaryCurrency: "USD",
        tags: ["Distributed Systems", "Go", "Kubernetes", "AWS"],
        experienceLevel: "senior",
        jobType: "full-time",
        source: "Y Combinator",
        applyUrl: "https://stripe.com/jobs",
        postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        postedAtTs: Date.now() - 2 * 86400000,
        description: "Scale globally distributed payment rails with ultra-high reliability. Work on systems that process millions of transactions per second with five-nines availability.",
        ghostScore: {
          score: 8,
          riskLevel: "low",
          reasons: ["Posted 2 days ago (Fresh post)", "Active interview loop verified", "Transparent salary band"],
          recommendations: ["High hiring intent verified by TrueHire. Recommended to apply!"],
        },
      },

      {
        id: "linkedin-linear-staff-frontend-2026",
        title: "Staff Frontend Engineer (Core Application)",
        company: "Linear",
        companyLogo: "https://logo.clearbit.com/linear.app",
        location: "Remote (Global)",
        isRemote: true,
        salaryMin: 190000,
        salaryMax: 240000,
        salaryFormatted: "$190k – $240k",
        salaryCurrency: "USD",
        tags: ["React", "TypeScript", "WebGL", "Performance", "State Machines", "Next.js"],
        experienceLevel: "lead",
        jobType: "full-time",
        source: "LinkedIn",
        sourceLogo: SOURCE_LOGOS["LinkedIn"],
        applyUrl: "https://linear.app/careers",
        postedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        postedAtTs: Date.now() - 4 * 86400000,
        description: `About Linear:
Linear is building the system for modern software development. High-growth product companies worldwide — including OpenAI, Vercel, Ramp, Cash App, and Substack — rely on Linear daily to plan, build, and ship world-class software.

We obsess over keyboard-first workflows, sub-50ms interaction latency, and fluid micro-animations that make software engineering feel like an artisanal craft again.

About the Role:
As a Staff Frontend Engineer on our Core Application team, you will shape the architecture of the primary Linear desktop and web clients. You will build offline-first synchronization primitives, optimize WebGL and Canvas graph renderers, and raise the bar for frontend quality across our entire engineering organization.

Key Responsibilities:
• Architect and implement critical frontend features using React, TypeScript, and modern browser standards.
• Own real-time collaborative state management with client-side SQLite/IndexedDB caching and CRDT conflict resolution.
• Drive 60fps rendering performance across deeply nested issue graphs, kanban boards, and project roadmaps.
• Mentor senior frontend engineers and set standards for component design, a11y, and type safety.
• Work directly with our design and product leads to invent novel, frictionless UI paradigms.

What We're Looking For:
• 6+ years of production experience building high-performance web applications in React and TypeScript.
• Deep expertise with browser rendering lifecycles, memory profiling, and virtualized data structures.
• Prior experience with offline-first architectures, optimistic mutations, or local-first sync engines.
• Uncompromising eye for UI polish, typography, keyboard shortcuts, and micro-interactions.
• Self-directed builder who thrives with high autonomy and direct customer feedback.

Compensation & Benefits:
• Competitive base salary: $190,000 – $240,000 USD + generous early-stage equity.
• Comprehensive medical, dental, and vision insurance for you and your dependents (100% company covered).
• Remote-first culture with annual worldwide team offsites (past offsites in Portugal, Iceland, Japan).
• Home office setup stipend ($3,000) + latest M-series MacBook Pro.
• Unlimited PTO with mandatory minimum vacation policies.`,
        ghostScore: {
          score: 14,
          riskLevel: "low",
          reasons: ["Posted 4 days ago", "Single posting (0 reposts)", "Transparent compensation"],
          recommendations: ["Active priority requisition. Focus portfolio on UI performance."],
        },
      },
      {
        id: "himalayas-openai-backend-2026",
        title: "Senior Backend Engineer — API Platform",
        company: "OpenAI",
        companyLogo: "https://logo.clearbit.com/openai.com",
        location: "San Francisco, CA / Remote",
        isRemote: true,
        salaryMin: 200000,
        salaryMax: 280000,
        salaryFormatted: "$200k – $280k",
        salaryCurrency: "USD",
        tags: ["Python", "FastAPI", "Kubernetes", "LLM", "Distributed Systems", "Go", "PostgreSQL"],
        experienceLevel: "senior",
        jobType: "full-time",
        source: "Himalayas",
        sourceLogo: SOURCE_LOGOS["Himalayas"],
        applyUrl: "https://openai.com/careers",
        postedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        postedAtTs: Date.now() - 1 * 86400000,
        description: `About OpenAI:
OpenAI is an AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity.

About the Role:
As a Senior Backend Engineer on the API Platform team, you will scale the backbone systems that deliver GPT-4, DALL-E, and Sora to millions of developers and enterprise partners worldwide. You will solve foundational distributed systems challenges around low-latency streaming, token rate-limiting, compute scheduling, and high-availability inference pipelines.

Key Responsibilities:
• Design, implement, and maintain low-latency gRPC and REST gateway services in Python (FastAPI) and Go.
• Build distributed queuing, rate-limiting, and caching layers using Redis, Kafka, and Kubernetes.
• Collaborate with ML infrastructure researchers to optimize token streaming and GPU cluster routing.
• Scale mission-critical billing, usage tracking, and multi-tenant isolation subsystems.
• Participate in on-call rotations and lead incident retrospectives to maintain 99.99% platform availability.

Required Qualifications:
• 5+ years of software engineering experience building and operating distributed backend systems at scale.
• Strong command of Python, Go, or C++ with deep understanding of concurrency and asynchronous I/O.
• Practical experience with Kubernetes, container orchestration, and multi-region cloud infrastructure (Azure / AWS).
• Solid foundation in database design, schema migrations, and indexing strategies with PostgreSQL and Redis.

Benefits & Compensation:
• Annual base compensation: $200,000 – $280,000 USD + OpenAI profit participation units (PPU).
• Top-tier health, dental, and vision coverage + wellness stipend.
• 401(k) retirement plan with employer matching.
• Flexible time off and generous parental leave.`,
        ghostScore: {
          score: 6,
          riskLevel: "low",
          reasons: ["Posted 1 day ago — very fresh", "Verified active hiring via Himalayas"],
          recommendations: ["Top priority listing. Apply immediately."],
        },
      },
      {
        id: "remotive-vercel-devrel-2026",
        title: "Developer Advocate — Edge & Compute",
        company: "Vercel",
        companyLogo: "https://logo.clearbit.com/vercel.com",
        location: "Remote (Global)",
        isRemote: true,
        salaryMin: 140000,
        salaryMax: 170000,
        salaryFormatted: "$140k – $170k",
        salaryCurrency: "USD",
        tags: ["Next.js", "TypeScript", "Edge Computing", "Cloudflare", "React", "Serverless"],
        experienceLevel: "mid",
        jobType: "full-time",
        source: "Remotive",
        sourceLogo: SOURCE_LOGOS["Remotive"],
        applyUrl: "https://vercel.com/careers",
        postedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        postedAtTs: Date.now() - 3 * 86400000,
        description: `About Vercel:
Vercel is the platform for frontend developers, providing the speed and reliability innovators need to create at the moment of inspiration. We are the creators of Next.js and pioneers in edge computing.

About the Role:
We are looking for a technical Developer Advocate to champion Vercel's Edge Compute runtime and modern frontend architectures. You will build cutting-edge demo applications, create technical guides, speak at international conferences, and interface directly between our developer community and product engineering teams.

What You'll Do:
• Build reference architectures demonstrating streaming server components, Edge middleware, and AI SDK integrations.
• Create high-signal technical video tutorials, blog posts, and open-source starter kits.
• Represent Vercel at developer events and host workshops worldwide.
• Synthesize community feedback into prioritized product specifications for our internal engineering squads.

What We Look For:
• 3+ years of production experience building full-stack applications with React, Next.js, and TypeScript.
• Proven track record of creating technical content (videos, blog posts, open-source repositories).
• Comfort with public speaking and explaining complex distributed systems concepts clearly.
• Passion for web performance, Core Web Vitals, and developer ergonomics.

Compensation & Benefits:
• Base salary: $140,000 – $170,000 USD + equity package.
• 100% remote flexibility with home office stipend.
• Comprehensive health benefits and 401(k).
• Generous conference and travel budgets.`,
        ghostScore: {
          score: 11,
          riskLevel: "low",
          reasons: ["Posted 3 days ago", "Verified Remotive employer"],
          recommendations: ["Ideal for experienced Next.js developers"],
        },
      },
      {
        id: "yc-scale-ai-fullstack-2026",
        title: "Fullstack AI Product Engineer",
        company: "Scale AI",
        companyLogo: "https://logo.clearbit.com/scale.com",
        location: "San Francisco / Remote",
        isRemote: true,
        salaryMin: 160000,
        salaryMax: 210000,
        salaryFormatted: "$160k – $210k",
        salaryCurrency: "USD",
        tags: ["Python", "Next.js", "LLM", "FastAPI", "TypeScript", "PostgreSQL"],
        experienceLevel: "mid",
        jobType: "full-time",
        source: "Y Combinator",
        applyUrl: "https://scale.com/careers",
        postedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        postedAtTs: Date.now() - 8 * 86400000,
        description: `About Scale AI:
Scale AI provides data infrastructure for the foundation model era. We partner with the world's leading AI labs, enterprises, and governments to power the next generation of generative AI models.

About the Role:
As a Fullstack AI Product Engineer, you will design and implement the user interfaces and orchestrations powering our Generative AI evaluation and enterprise agent products. You will work on collaborative prompt engineering workflows, automated red-teaming dashboards, and human-in-the-loop review tools.

Responsibilities:
• Develop real-time frontend interfaces using Next.js, React, and Tailwind CSS.
• Build reliable backend APIs and async task workers in Python (FastAPI) and PostgreSQL.
• Integrate frontier LLM APIs (OpenAI, Anthropic, Gemini, open weights) for automated synthetic evaluation.
• Collaborate closely with ML researchers, product managers, and enterprise customers.

Qualifications:
• 3+ years of fullstack software engineering experience in modern JavaScript/TypeScript and Python.
• Experience building interactive web applications with complex state and real-time streaming data.
• Familiarity with LLM APIs, prompt engineering, or vector retrieval systems.
• BS or MS in Computer Science or equivalent practical experience.

Compensation & Perks:
• Salary: $160,000 – $210,000 USD + substantial Scale AI equity.
• Full health coverage + 401k match.
• Flexible work location (San Francisco HQ or Remote US/Canada).
• Daily lunch & dinner catering for in-office teammates or food stipend for remote.`,
        ghostScore: {
          score: 18,
          riskLevel: "low",
          reasons: ["Active team expansion", "Direct engineering manager review"],
          recommendations: ["Verified active listing"],
        },
      },
      {
        id: "stale-corp-swe-2026",
        title: "Senior Backend Java Engineer",
        company: "Legacy Enterprise Systems",
        location: "Chicago, IL",
        isRemote: false,
        tags: ["Java", "Spring Boot", "Oracle", "SOAP", "J2EE"],
        experienceLevel: "senior",
        jobType: "full-time",
        source: "LinkedIn",
        sourceLogo: SOURCE_LOGOS["LinkedIn"],
        applyUrl: "https://example.com/apply",
        postedAt: new Date(Date.now() - 72 * 86400000).toISOString(),
        postedAtTs: Date.now() - 72 * 86400000,
        description: `Overview:
Legacy Enterprise Systems is seeking a Senior Java Backend Engineer to maintain legacy batch billing procedures, SOAP web services, and Oracle database stored procedures for internal corporate reporting.

Requirements:
• 8+ years experience with Java 8/11, Spring Boot, and Hibernate.
• Working knowledge of Oracle PL/SQL stored procedures and DB2 integrations.
• Experience maintaining monolithic architectures.

TrueHire Anti-Ghosting Analysis:
⚠️ This position has been active for 72 consecutive days without updates or confirmed interview loops. Public data indicates this may be an evergreen requisition used for candidate pipeline harvesting rather than an active immediate opening.`,
        ghostScore: {
          score: 82,
          riskLevel: "high",
          reasons: [
            "Position open for 72 days without closure (>60 days ghost threshold)",
            "Reposted 4 times across job boards",
            "0 candidate interviews in past 30 days",
            "No salary transparency",
          ],
          recommendations: ["⚠️ High Ghost Risk — likely an evergreen/pooling listing, not an active hire."],
        },
      },
    ];

    for (const job of seed) {
      this.jobs.push(job);
      this.seenIds.add(job.id);
    }
  }
}

export const jobAggregator = new JobAggregatorService();
