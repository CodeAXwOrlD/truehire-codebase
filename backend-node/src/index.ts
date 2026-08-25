import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { authRateLimiter, generalRateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth.routes";
import { requisitionsRouter } from "./routes/requisitions.routes";
import { scoringRouter } from "./routes/scoring.routes";
import { jobsRouter } from "./routes/jobs.routes";
import { candidateRouter } from "./routes/candidate.routes";
import { jobAggregator } from "./lib/jobAggregator";
import { prisma } from "./lib/prisma";

const app = express();

// ---- Security & parsing middleware ----
app.use(helmet());
app.use(
  cors({
    origin: env.corsAllowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(generalRateLimiter);

// ---- Health check ----
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ data: { status: "ok", db: "connected" }, error: null });
  } catch {
    return res.status(503).json({ data: { status: "degraded", db: "unreachable" }, error: null });
  }
});

// ---- Routes ----
app.use("/api/auth", authRateLimiter, authRouter);
app.use("/api/requisitions", requisitionsRouter);
app.use("/api/scoring", scoringRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/candidate", candidateRouter);

// ---- Error handler ----
app.use(errorHandler);

// Start live job aggregation
jobAggregator.startLiveIngestion().catch(console.error);

app.listen(env.port, () => {
  console.log(`[backend-node] listening on http://localhost:${env.port} (${env.nodeEnv})`);
});
