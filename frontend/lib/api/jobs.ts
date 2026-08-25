import { apiFetch } from "./client";

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
  tags: string[];
  source: "RemoteOK" | "Y Combinator" | "LinkedIn" | "Arbeitnow" | "Direct";
  applyUrl: string;
  postedAt: string;
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
}

export async function fetchJobs(params?: JobFilterParams) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.isRemote !== undefined) query.set("isRemote", String(params.isRemote));
  if (params?.maxRiskScore !== undefined) query.set("maxRiskScore", String(params.maxRiskScore));
  if (params?.source && params.source !== "all") query.set("source", params.source);
  if (params?.tag) query.set("tag", params.tag);

  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<UnifiedJob[]>(`/api/jobs${qs}`);
}

export async function fetchJob(id: string) {
  return apiFetch<UnifiedJob>(`/api/jobs/${id}`);
}

export async function applyToJob(id: string) {
  return apiFetch<{ message: string; jobId: string }>(`/api/jobs/${id}/apply`, {
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
