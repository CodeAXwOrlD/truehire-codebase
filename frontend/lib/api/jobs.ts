import { apiFetch } from "./client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ─── Types ───────────────────────────────────────────────────────────────────

export type JobSource =
  | "RemoteOK" | "Arbeitnow" | "Himalayas" | "Remotive" | "Jobicy"
  | "The Muse" | "FindWork" | "JSearch" | "Y Combinator" | "LinkedIn"
  | "Indeed" | "Glassdoor" | "ZipRecruiter" | "Adzuna" | "Direct";

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

export interface JobFilterParams {
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

export interface ResumeParseResult {
  skills: string[];
  experienceYears: number;
  detectedRoles: string[];
  summary: string;
  filename: string;
  fileSizeBytes: number;
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function fetchJobs(params?: JobFilterParams) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.isRemote !== undefined) query.set("isRemote", String(params.isRemote));
  if (params?.maxRiskScore !== undefined) query.set("maxRiskScore", String(params.maxRiskScore));
  if (params?.source && params.source !== "all") query.set("source", params.source);
  if (params?.tag) query.set("tag", params.tag);
  if (params?.experienceLevel && params.experienceLevel !== "any") query.set("experienceLevel", params.experienceLevel);
  if (params?.jobType && params.jobType !== "any") query.set("jobType", params.jobType);
  if (params?.postedWithinDays) query.set("postedWithinDays", String(params.postedWithinDays));
  if (params?.salaryMin) query.set("salaryMin", String(params.salaryMin));
  if (params?.salaryMax) query.set("salaryMax", String(params.salaryMax));

  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<UnifiedJob[]>(`/api/jobs${qs}`);
}

export async function fetchJob(id: string) {
  return apiFetch<UnifiedJob>(`/api/jobs/${id}`);
}

export async function applyToJob(id: string) {
  return apiFetch<{ message: string; jobId: string; company: string }>(`/api/jobs/${id}/apply`, {
    method: "POST",
  });
}

export async function fetchMyApplications() {
  return apiFetch<
    Array<{
      jobId: string;
      appliedAt: string;
      status: string;
      job: UnifiedJob;
    }>
  >("/api/jobs/user/applications");
}

/**
 * Upload a PDF/DOCX resume file and parse it via Python NLP service.
 * Returns extracted skills, experience years, and detected roles instantly
 * — no scanning delay (HiringCafe style).
 */
export async function parseResume(file: File): Promise<{
  data: ResumeParseResult | null;
  error: string | null;
}> {
  try {
    const { getAccessToken } = await import("./client");
    const token = getAccessToken();

    const formData = new FormData();
    formData.append("resume", file);

    const res = await fetch(`${API_URL}/api/jobs/parse-resume`, {
      method: "POST",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const body = await res.json();
    return body;
  } catch (err) {
    return { data: null, error: "Upload failed. Please try again." };
  }
}

/**
 * Fetch analytics data for the recruiter dashboard.
 */
export async function fetchRecruiterAnalytics() {
  return apiFetch<{
    kpis: {
      totalRequisitions: number;
      openRequisitions: number;
      closedRequisitions: number;
      avgTimeToFillDays: number;
      avgGhostScore: number;
      industryBenchmarkTtf: number;
      pipelineConversionRate: number;
      offerAcceptanceRate: number;
    };
    weeklyTtfTrend: Array<{ week: string; days: number; reqs: number }>;
    pipelineFunnel: Array<{ stage: string; count: number; fill: string }>;
    statusBreakdown: Array<{ name: string; value: number; fill: string }>;
    ghostRiskTrend: Array<{ day: string; score: number }>;
  }>("/api/analytics/recruiter");
}
