import { Router } from "express";
import { requireAuth } from "../middleware/auth";

export const scoringRouter = Router();

scoringRouter.get("/health", async (req, res) => {
  return res.json({ data: { status: "scoring router ready" }, error: null });
});
