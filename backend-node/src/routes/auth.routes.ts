import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword, generateRefreshToken } from "../lib/password";
import { signAccessToken } from "../lib/jwt";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";
import crypto from "node:crypto";

export const authRouter = Router();

const REFRESH_COOKIE_NAME = "th_refresh";

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/auth",
};

// ---------- Signup ----------
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["candidate", "recruiter"]),
});

authRouter.post("/signup", async (req, res, next) => {
  try {
    const { email, password, role } = signupSchema.parse(req.body);
    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({
        data: null,
        error: "An account with this email already exists. Please sign in.",
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        role,
        emailVerified: true,
      },
    });

    if (role === "candidate") {
      await prisma.candidate.create({ data: { userId: user.id } });
    }

    // Direct Login on Signup
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const { token: refreshToken, tokenHash } = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

    return res.status(201).json({
      data: {
        accessToken,
        user: { id: user.id, email: user.email, role: user.role },
        message: "Account created and authenticated successfully!",
      },
      error: null,
    });
  } catch (err) {
    return next(err);
  }
});

// ---------- Login ----------
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    const genericError = { data: null, error: "Invalid email or password" };

    if (!user) return res.status(401).json(genericError);

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) return res.status(401).json(genericError);

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const { token: refreshToken, tokenHash } = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

    return res.json({
      data: {
        accessToken,
        user: { id: user.id, email: user.email, role: user.role },
        message: "Login successful!",
      },
      error: null,
    });
  } catch (err) {
    return next(err);
  }
});

// ---------- Refresh ----------
authRouter.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) return res.status(401).json({ data: null, error: "Not authenticated" });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const stored = await prisma.refreshToken.findFirst({
      where: { tokenHash, revoked: false },
    });

    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ data: null, error: "Session expired, please log in again" });
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) return res.status(401).json({ data: null, error: "Not authenticated" });

    // Rotate: revoke the old refresh token, issue a new one.
    const { token: newRefreshToken, tokenHash: newHash } = generateRefreshToken();
    await prisma.$transaction([
      prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } }),
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: newHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions);
    return res.json({ data: { accessToken }, error: null });
  } catch (err) {
    return next(err);
  }
});

// ---------- Current user ----------
authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) return res.status(401).json({ data: null, error: "Not authenticated" });

    return res.json({
      data: { id: user.id, email: user.email, role: user.role },
      error: null,
    });
  } catch (err) {
    return next(err);
  }
});

// ---------- Logout ----------
authRouter.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
    return res.json({ data: { message: "Logged out" }, error: null });
  } catch (err) {
    return next(err);
  }
});
