import { Router } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { callScoringService } from "../lib/serviceClient";

export const candidateRouter = Router();

// In-memory candidate profile store
interface CandidateProfile {
  userId: string;
  skills: string[];
  experienceYears: number;
  resumeText: string;
  targetRole: string;
}

const candidateProfiles = new Map<string, CandidateProfile>();

// GET /api/candidate/profile - Retrieve candidate profile & skills
candidateRouter.get("/profile", (req, res) => {
  let userId = "guest";
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(authHeader.split(" ")[1]);
      userId = payload.sub;
    } catch {
      userId = "guest";
    }
  }

  const profile = candidateProfiles.get(userId) || {
    userId,
    skills: [],
    experienceYears: 0,
    resumeText: "",
    targetRole: "",
  };

  return res.json({ data: profile, error: null });
});

// POST /api/candidate/profile - Save candidate profile & extract skills (public with optional auth)
candidateRouter.post("/profile", async (req, res) => {
  let userId = "guest";
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(authHeader.split(" ")[1]);
      userId = payload.sub;
    } catch {
      userId = "guest";
    }
  }

  const { resumeText, skills, experienceYears, targetRole } = req.body;

  let finalSkills = skills || [];
  let finalExp = typeof experienceYears === "number" ? experienceYears : 0;

  if (resumeText) {
    const parseRes = await callScoringService<{
      skills: string[];
      experience_years: number;
      detected_roles: string[];
    }>("/match-score/parse-resume", "POST", { resume_text: resumeText });

    if (parseRes.data) {
      finalSkills = Array.from(new Set([...finalSkills, ...parseRes.data.skills]));
      finalExp = parseRes.data.experience_years;
    }
  }

  const profile: CandidateProfile = {
    userId,
    skills: finalSkills,
    experienceYears: finalExp,
    resumeText: resumeText || "",
    targetRole: targetRole || "",
  };

  candidateProfiles.set(userId, profile);
  return res.json({ data: profile, error: null });
});

// POST /api/candidate/match-job - Calculate match percentage for a specific job
candidateRouter.post("/match-job", async (req, res) => {
  const { candidateSkills, candidateExperienceYears, jobTitle, jobTags, jobDescription } = req.body;

  const userSkills: string[] = Array.isArray(candidateSkills) ? candidateSkills : [];
  const userExp = typeof candidateExperienceYears === "number" ? candidateExperienceYears : 0;

  const matchRes = await callScoringService<{
    match_percentage: number;
    matched_skills: string[];
    missing_skills: string[];
    alignment_summary: string;
    tailoring_tips: string[];
  }>("/match-score/calculate", "POST", {
    candidate_skills: userSkills,
    candidate_experience_years: userExp,
    job_title: jobTitle,
    job_tags: jobTags || [],
    job_description: jobDescription || "",
  });

  if (matchRes.error || !matchRes.data) {
    // Real calculation fallback if scoring service is unreachable
    if (userSkills.length === 0) {
      return res.json({
        data: {
          matchPercentage: 0,
          matchedSkills: [],
          missingSkills: jobTags || [],
          alignmentSummary: "Upload your resume to calculate a personalized match score.",
          tailoringTips: ["Upload your resume or set your skills to see match alignment."],
        },
        error: null,
      });
    }

    const tags: string[] = (jobTags || []).map((t: string) => t.toLowerCase());
    const matched = userSkills.filter(s =>
      tags.some(t => t.includes(s.toLowerCase()) || s.toLowerCase().includes(t))
    );
    const missing = (jobTags || []).filter((t:any) =>
      !userSkills.some(s => s.toLowerCase() === t.toLowerCase())
    ).slice(0, 5);
    const pct = tags.length > 0 ? Math.round((matched.length / tags.length) * 100) : 0;

    return res.json({
      data: {
        matchPercentage: pct,
        matchedSkills: matched,
        missingSkills: missing,
        alignmentSummary: matched.length > 0
          ? `Matched ${matched.length} of ${tags.length} required tags.`
          : "No direct skill overlap detected.",
        tailoringTips: missing.length > 0
          ? [`Consider highlighting experience with ${missing.slice(0, 3).join(", ")}.`]
          : [],
      },
      error: null,
    });
  }

  return res.json({
    data: {
      matchPercentage: matchRes.data.match_percentage,
      matchedSkills: matchRes.data.matched_skills,
      missingSkills: matchRes.data.missing_skills,
      alignmentSummary: matchRes.data.alignment_summary,
      tailoringTips: matchRes.data.tailoring_tips,
    },
    error: null,
  });
});
