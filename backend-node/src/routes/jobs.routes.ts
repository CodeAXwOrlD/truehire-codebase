import { Router } from "express";
import { jobAggregator } from "../lib/jobAggregator";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export const jobsRouter = Router();

// In-memory candidate applications store for external / aggregated jobs
const externalApplications: Array<{
  jobId: string;
  userId: string;
  appliedAt: string;
  status: string;
}> = [];

// GET /api/jobs - List filterable jobs
jobsRouter.get("/", (req, res) => {
  const search = req.query.search as string | undefined;
  const isRemote = req.query.isRemote !== undefined ? req.query.isRemote === "true" : undefined;
  const maxRiskScore = req.query.maxRiskScore ? Number(req.query.maxRiskScore) : undefined;
  const source = req.query.source as string | undefined;
  const tag = req.query.tag as string | undefined;

  const jobs = jobAggregator.getJobs({
    search,
    isRemote,
    maxRiskScore,
    source,
    tag,
  });

  return res.json({ data: jobs, error: null });
});

// GET /api/jobs/stream - Server-Sent Events (SSE) live real-time job stream
jobsRouter.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", count: jobAggregator.getJobs().length })}\n\n`);

  const unsubscribe = jobAggregator.subscribe((newJob) => {
    res.write(`data: ${JSON.stringify({ type: "NEW_JOB", job: newJob })}\n\n`);
  });

  req.on("close", () => {
    unsubscribe();
    res.end();
  });
});

// GET /api/jobs/:id - Get specific job details
jobsRouter.get("/:id", (req, res) => {
  const job = jobAggregator.getJobById(req.params.id);
  if (!job) {
    return res.status(404).json({ data: null, error: "Job listing not found" });
  }
  return res.json({ data: job, error: null });
});

// POST /api/jobs/:id/apply - 1-click candidate application
jobsRouter.post("/:id/apply", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.sub;

  const job = jobAggregator.getJobById(id);
  if (!job) {
    return res.status(404).json({ data: null, error: "Job listing not found" });
  }

  // Record application
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
      appliedAt: new Date().toISOString(),
      status: "applied",
    },
    error: null,
  });
});

// GET /api/jobs/my-applications - Candidate tracked applications
jobsRouter.get("/user/applications", requireAuth, (req, res) => {
  const userId = req.user!.sub;
  const userApps = externalApplications
    .filter((a) => a.userId === userId)
    .map((a) => {
      const job = jobAggregator.getJobById(a.jobId);
      return {
        ...a,
        job: job || { id: a.jobId, title: "Position", company: "Company", ghostScore: { score: 10, riskLevel: "low" } },
      };
    });

  return res.json({ data: userApps, error: null });
});

// POST /api/jobs/upload-resume-url - Issue signed URL for resume upload
jobsRouter.post("/upload-resume-url", requireAuth, (req, res) => {
  const userId = req.user!.sub;
  const filename = req.body.filename || "resume.pdf";
  const signedUrl = `https://storage.truehire.dev/resumes/${userId}/${Date.now()}_${encodeURIComponent(filename)}`;

  return res.json({
    data: {
      uploadUrl: signedUrl,
      fileKey: `${userId}/${filename}`,
      expiresInSeconds: 900,
    },
    error: null,
  });
});
