import { apiFetch } from "./client";

export interface RequisitionSummary {
  id: string;
  title: string;
  company: string;
  salaryRange?: string | null;
  status: "open" | "paused" | "closed";
  openedAt: string;
  applicantCount: number;
  eventCount: number;
  latestGhostScore?: {
    id: string;
    score: number;
    riskLevel: "low" | "medium" | "high";
    computedAt: string;
  } | null;
}

export interface RequisitionDetail extends RequisitionSummary {
  events: Array<{
    id: string;
    type: "interview" | "offer" | "activity";
    occurredAt: string;
  }>;
  applications: Array<{
    id: string;
    stage: "applied" | "viewed" | "interview" | "offer" | "rejected";
    matchScore?: number | null;
    appliedAt: string;
    candidate: {
      id: string;
      resumeUrl?: string | null;
      user: {
        email: string;
      };
    };
  }>;
}

export interface CreateRequisitionInput {
  title: string;
  company: string;
  salaryRange?: string;
  status?: "open" | "paused" | "closed";
}

export async function fetchRequisitions(status?: string) {
  const query = status ? `?status=${status}` : "";
  return apiFetch<RequisitionSummary[]>(`/api/requisitions${query}`);
}

export async function fetchRequisition(id: string) {
  return apiFetch<RequisitionDetail>(`/api/requisitions/${id}`);
}

export async function createRequisition(input: CreateRequisitionInput) {
  return apiFetch<RequisitionSummary>("/api/requisitions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateRequisition(id: string, input: Partial<CreateRequisitionInput>) {
  return apiFetch<RequisitionSummary>(`/api/requisitions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function logRequisitionEvent(id: string, type: "interview" | "offer" | "activity") {
  return apiFetch(`/api/requisitions/${id}/events`, {
    method: "POST",
    body: JSON.stringify({ type }),
  });
}

export async function deleteRequisition(id: string) {
  return apiFetch(`/api/requisitions/${id}`, {
    method: "DELETE",
  });
}
