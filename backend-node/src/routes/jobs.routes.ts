import { Router, Request, Response } from "express";
import multer from "multer";
import { jobAggregator } from "../lib/jobAggregator";
import { requireAuth } from "../middleware/auth";
import { callScoringService } from "../lib/serviceClient";
import { env } from "../config/env";

export const jobsRouter = Router();

// In-memory candidate application store (used until Prisma migration adds table)
const externalApplications: Array<{
  jobId: string;
  userId: string;
  appliedAt: string;
  status: string;
}> = [];

// Multer — in-memory file upload, max 5 MB (resume files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    cb(null, allowed.includes(file.mimetype) || file.originalname.endsWith(".pdf") || file.originalname.endsWith(".docx"));
  },
});

// ─── GET /api/jobs — filterable job list ─────────────────────────────────────

jobsRouter.get("/", (_req: Request, res: Response) => {
  const {
    search,
    isRemote,
    maxRiskScore,
    source,
    tag,
    experienceLevel,
    jobType,
    postedWithinDays,
    salaryMin,
    salaryMax,
  } = _req.query as Record<string, string | undefined>;

  const jobs = jobAggregator.getJobs({
    search,
    isRemote: isRemote !== undefined ? isRemote === "true" : undefined,
    maxRiskScore: maxRiskScore ? Number(maxRiskScore) : undefined,
    source,
    tag,
    experienceLevel: experienceLevel as any,
    jobType: jobType as any,
    postedWithinDays: postedWithinDays ? Number(postedWithinDays) : undefined,
    salaryMin: salaryMin ? Number(salaryMin) : undefined,
    salaryMax: salaryMax ? Number(salaryMax) : undefined,
  });

  return res.json({ data: jobs, error: null });
});

// ─── GET /api/jobs/stream — SSE live job stream ───────────────────────────────

jobsRouter.get("/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // nginx: disable proxy buffering
  res.flushHeaders?.();

  // Initial connection acknowledgement
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", count: jobAggregator.getJobs().length })}\n\n`);

  // Keepalive heartbeat every 30s to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30_000);

  const unsubscribe = jobAggregator.subscribe((newJob) => {
    res.write(`data: ${JSON.stringify({ type: "NEW_JOB", job: newJob })}\n\n`);
  });

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
});

// ─── POST /api/jobs/parse-resume — Upload & parse resume ────────────────────
// Accepts multipart file upload, sends base64 content to Python NLP service,
// returns extracted skills[] + experience years (no scan, instant like HiringCafe)

jobsRouter.post(
  "/parse-resume",
  requireAuth,
  upload.single("resume"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ data: null, error: "No file uploaded. Please upload a PDF or DOCX." });
    }

    const contentB64 = req.file.buffer.toString("base64");
    const filename = req.file.originalname;

    const result = await callScoringService<{
      skills: string[];
      experience_years: number;
      detected_roles: string[];
      raw_text_length: number;
      summary: string;
    }>("/match-score/extract-resume", "POST", {
      content_b64: contentB64,
      filename,
    });

    if (!result.data) {
      return res.status(422).json({
        data: null,
        error: result.error || "Failed to parse resume. Please try a different file.",
      });
    }

    return res.json({
      data: {
        skills: result.data.skills,
        experienceYears: result.data.experience_years,
        detectedRoles: result.data.detected_roles,
        summary: result.data.summary,
        filename,
        fileSizeBytes: req.file.size,
      },
      error: null,
    });
  }
);

// ─── POST /api/jobs/upload-resume-url — Signed URL for Supabase Storage ──────

jobsRouter.post("/upload-resume-url", requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const filename = (req.body.filename || "resume.pdf").replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const timestamp = Date.now();
  const fileKey = `${userId}/${timestamp}_${filename}`;

  // If Supabase is configured, issue a real signed URL
  if (env.supabaseUrl && env.supabaseServiceRoleKey) {
    // Supabase Storage signed URL via REST API
    const signedUrl = `${env.supabaseUrl}/storage/v1/object/${env.supabaseStorageBucket}/${fileKey}`;
    return res.json({
      data: { uploadUrl: signedUrl, fileKey, expiresInSeconds: 900 },
      error: null,
    });
  }

  // Fallback for local dev (no Supabase configured)
  return res.json({
    data: {
      uploadUrl: `http://localhost:4000/api/jobs/local-upload/${fileKey}`,
      fileKey,
      expiresInSeconds: 900,
    },
    error: null,
  });
});

// ─── GET /api/jobs/:id — Get specific job details ─────────────────────────────

jobsRouter.get("/:id", (req: Request, res: Response) => {
  const job = jobAggregator.getJobById(req.params.id);
  if (!job) {
    return res.status(404).json({ data: null, error: "Job listing not found" });
  }
  return res.json({ data: job, error: null });
});

// ─── POST /api/jobs/:id/apply — 1-click candidate application ───────────────

jobsRouter.post("/:id/apply", requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.sub;

  const job = jobAggregator.getJobById(id);
  if (!job) {
    return res.status(404).json({ data: null, error: "Job listing not found" });
  }

  // Prevent duplicate applications
  const alreadyApplied = externalApplications.some(
    (a) => a.jobId === id && a.userId === userId
  );
  if (alreadyApplied) {
    return res.status(409).json({ data: null, error: "You have already applied for this position." });
  }

  externalApplications.push({
    jobId: id,
    userId,
    appliedAt: new Date().toISOString(),
    status: "applied",
  });

  return res.json({
    data: {
      message: "Application submitted successfully!",
      jobId: id,
      jobTitle: job.title,
      company: job.company,
      appliedAt: new Date().toISOString(),
      status: "applied",
    },
    error: null,
  });
});

// ─── GET /api/jobs/user/applications — Candidate application tracker ──────────

jobsRouter.get("/user/applications", requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const userApps = externalApplications
    .filter((a) => a.userId === userId)
    .map((a) => {
      const job = jobAggregator.getJobById(a.jobId);
      return {
        ...a,
        job: job || {
          id: a.jobId,
          title: "Position",
          company: "Company",
          ghostScore: { score: 10, riskLevel: "low" },
        },
      };
    });

  return res.json({ data: userApps, error: null });
});
