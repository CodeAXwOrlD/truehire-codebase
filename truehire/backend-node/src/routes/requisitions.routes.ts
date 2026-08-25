import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export const requisitionsRouter = Router();

const createRequisitionSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  company: z.string().min(2, "Company must be at least 2 characters"),
  salaryRange: z.string().optional(),
  status: z.enum(["open", "paused", "closed"]).optional().default("open"),
});

const updateRequisitionSchema = z.object({
  title: z.string().min(2).optional(),
  company: z.string().min(2).optional(),
  salaryRange: z.string().optional(),
  status: z.enum(["open", "paused", "closed"]).optional(),
});

const logEventSchema = z.object({
  type: z.enum(["interview", "offer", "activity"]),
});

// List all requisitions for the logged-in recruiter
requisitionsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const recruiterId = req.user!.sub;
    const status = req.query.status as string | undefined;

    const requisitions = await prisma.requisition.findMany({
      where: {
        recruiterId,
        ...(status && ["open", "paused", "closed"].includes(status) ? { status: status as any } : {}),
      },
      include: {
        _count: {
          select: {
            applications: true,
            events: true,
          },
        },
        ghostScores: {
          orderBy: { computedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { openedAt: "desc" },
    });

    const formatted = requisitions.map((r) => ({
      id: r.id,
      title: r.title,
      company: r.company,
      salaryRange: r.salaryRange,
      status: r.status,
      openedAt: r.openedAt,
      applicantCount: r._count.applications,
      eventCount: r._count.events,
      latestGhostScore: r.ghostScores[0] || null,
    }));

    return res.json({ data: formatted, error: null });
  } catch (err) {
    return next(err);
  }
});

// Get single requisition with pipeline details and events
requisitionsRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user!.sub;

    const requisition = await prisma.requisition.findFirst({
      where: { id, recruiterId },
      include: {
        events: {
          orderBy: { occurredAt: "desc" },
        },
        ghostScores: {
          orderBy: { computedAt: "desc" },
          take: 1,
        },
        applications: {
          include: {
            candidate: {
              include: {
                user: {
                  select: { email: true },
                },
              },
            },
          },
          orderBy: { appliedAt: "desc" },
        },
      },
    });

    if (!requisition) {
      return res.status(404).json({ data: null, error: "Requisition not found" });
    }

    return res.json({ data: requisition, error: null });
  } catch (err) {
    return next(err);
  }
});

// Create a new requisition
requisitionsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const recruiterId = req.user!.sub;
    const body = createRequisitionSchema.parse(req.body);

    const requisition = await prisma.requisition.create({
      data: {
        recruiterId,
        title: body.title,
        company: body.company,
        salaryRange: body.salaryRange,
        status: body.status,
      },
    });

    // Automatically log creation event
    await prisma.requisitionEvent.create({
      data: {
        requisitionId: requisition.id,
        type: "activity",
      },
    });

    return res.status(201).json({ data: requisition, error: null });
  } catch (err) {
    return next(err);
  }
});

// Update requisition
requisitionsRouter.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user!.sub;
    const body = updateRequisitionSchema.parse(req.body);

    const existing = await prisma.requisition.findFirst({ where: { id, recruiterId } });
    if (!existing) {
      return res.status(404).json({ data: null, error: "Requisition not found" });
    }

    const updated = await prisma.requisition.update({
      where: { id },
      data: body,
    });

    return res.json({ data: updated, error: null });
  } catch (err) {
    return next(err);
  }
});

// Log an event for a requisition (e.g. interview scheduled, offer made)
requisitionsRouter.post("/:id/events", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user!.sub;
    const body = logEventSchema.parse(req.body);

    const existing = await prisma.requisition.findFirst({ where: { id, recruiterId } });
    if (!existing) {
      return res.status(404).json({ data: null, error: "Requisition not found" });
    }

    const event = await prisma.requisitionEvent.create({
      data: {
        requisitionId: id,
        type: body.type,
      },
    });

    return res.status(201).json({ data: event, error: null });
  } catch (err) {
    return next(err);
  }
});

// Delete/close requisition
requisitionsRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user!.sub;

    const existing = await prisma.requisition.findFirst({ where: { id, recruiterId } });
    if (!existing) {
      return res.status(404).json({ data: null, error: "Requisition not found" });
    }

    await prisma.requisition.delete({ where: { id } });
    return res.json({ data: { message: "Requisition deleted" }, error: null });
  } catch (err) {
    return next(err);
  }
});
