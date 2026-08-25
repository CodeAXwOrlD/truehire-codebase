import { apiFetch } from "./client";

export interface CandidateProfile {
  userId: string;
  skills: string[];
  experienceYears: number;
  resumeText: string;
  targetRole: string;
}

export interface MatchScoreResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  alignmentSummary: string;
  tailoringTips: string[];
}

export async function fetchCandidateProfile() {
  return apiFetch<CandidateProfile>("/api/candidate/profile");
}

export async function updateCandidateProfile(data: Partial<CandidateProfile>) {
  return apiFetch<CandidateProfile>("/api/candidate/profile", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function calculateJobMatch(payload: {
  candidateSkills: string[];
  candidateExperienceYears?: number;
  jobTitle: string;
  jobTags: string[];
  jobDescription?: string;
}) {
  return apiFetch<MatchScoreResult>("/api/candidate/match-job", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
