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
import { prisma } from "./lib/prisma";

const app = express();

// ---- Security & parsing middleware ----
app.use(helmet());
app.use(
  cors({
    origin: env.corsAllowedOrigins,
    credentials: true, // needed for the httpOnly refresh cookie
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(generalRateLimiter);

// ---- Health check (used by deploy platforms + local sanity check) ----
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

// ---- Error handler (must be last) ----
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`[backend-node] listening on http://localhost:${env.port} (${env.nodeEnv})`);
});
