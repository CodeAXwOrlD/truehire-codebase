import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword, generateOtp, hashOtp, generateRefreshToken } from "../lib/password";
import { signAccessToken } from "../lib/jwt";
import { sendOtpEmail } from "../lib/mailer";
import { sendOtpWhatsApp, normalizePhoneNumber } from "../lib/whatsapp";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";
import crypto from "node:crypto";

export const authRouter = Router();

const OTP_TTL_MS = 10 * 60 * 1000;
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

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Generic message — don't reveal whether the email is already registered.
      return res.status(200).json({
        data: { message: "If that email isn't already registered, a verification code has been sent." },
        error: null,
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, role },
    });

    if (role === "candidate") {
      await prisma.candidate.create({ data: { userId: user.id } });
    }

    const { code, codeHash } = generateOtp();
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        codeHash,
        purpose: "verify_email",
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
    await sendOtpEmail(email, code, "verify_email");

    return res.status(201).json({
      data: { message: "Account created. Check your email for a verification code." },
      error: null,
    });
  } catch (err) {
    return next(err);
  }
});

// ---------- WhatsApp Send OTP (1-Click Login / Register) ----------
const sendWhatsAppOtpSchema = z.object({
  phone: z.string().min(8, "Valid phone number required"),
  role: z.enum(["candidate", "recruiter"]).optional().default("candidate"),
});

authRouter.post("/whatsapp/send-otp", async (req, res, next) => {
  try {
    const { phone, role } = sendWhatsAppOtpSchema.parse(req.body);
    const normalized = normalizePhoneNumber(phone);
    const virtualEmail = `${normalized}@whatsapp.truehire.dev`;

    let user = await prisma.user.findUnique({ where: { email: virtualEmail } });
    if (!user) {
      // Auto-provision user account for WhatsApp passwordless authentication
      const placeholderPassword = crypto.randomBytes(24).toString("hex");
      const passwordHash = await hashPassword(placeholderPassword);
      user = await prisma.user.create({
        data: {
          email: virtualEmail,
          passwordHash,
          role,
          emailVerified: false,
        },
      });

      if (role === "candidate") {
        await prisma.candidate.create({ data: { userId: user.id } });
      }
    }

    const { code, codeHash } = generateOtp();
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        codeHash,
        purpose: "verify_email",
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await sendOtpWhatsApp({ toPhone: normalized, code, purpose: "login_otp" });

    return res.json({
      data: {
        message: `Verification code sent to WhatsApp (+${normalized}).`,
        phone: normalized,
      },
      error: null,
    });
  } catch (err) {
    return next(err);
  }
});

// ---------- WhatsApp Verify OTP & Auto-Login ----------
const verifyWhatsAppOtpSchema = z.object({
  phone: z.string().min(8),
  code: z.string().length(6),
});

authRouter.post("/whatsapp/verify-otp", async (req, res, next) => {
  try {
    const { phone, code } = verifyWhatsAppOtpSchema.parse(req.body);
    const normalized = normalizePhoneNumber(phone);
    const virtualEmail = `${normalized}@whatsapp.truehire.dev`;

    const user = await prisma.user.findUnique({ where: { email: virtualEmail } });
    if (!user) {
      return res.status(400).json({ data: null, error: "Invalid phone number or expired session" });
    }

    const codeHash = hashOtp(code);
    const otp = await prisma.otpCode.findFirst({
      where: { userId: user.id, consumed: false, codeHash },
      orderBy: { createdAt: "desc" },
    });

    if (!otp || otp.expiresAt < new Date()) {
      return res.status(400).json({ data: null, error: "Invalid or expired 6-digit code" });
    }

    await prisma.$transaction([
      prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } }),
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
    ]);

    // Issue JWT session
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
        message: "Successfully verified and authenticated!",
      },
      error: null,
    });
  } catch (err) {
    return next(err);
  }
});

// ---------- Universal Verify (Email & WhatsApp) ----------
const verifySchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  identifier: z.string().optional(),
  code: z.string().length(6),
});

authRouter.post("/verify", async (req, res, next) => {
  try {
    const body = verifySchema.parse(req.body);
    const targetEmail =
      body.email ||
      (body.phone ? `${normalizePhoneNumber(body.phone)}@whatsapp.truehire.dev` : "") ||
      (body.identifier?.includes("@") ? body.identifier : body.identifier ? `${normalizePhoneNumber(body.identifier)}@whatsapp.truehire.dev` : "");

    if (!targetEmail) {
      return res.status(400).json({ data: null, error: "Email or phone identifier is required" });
    }

    const user = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!user) return res.status(400).json({ data: null, error: "Invalid code or user not found" });

    const codeHash = hashOtp(body.code);
    const otp = await prisma.otpCode.findFirst({
      where: { userId: user.id, consumed: false, codeHash },
      orderBy: { createdAt: "desc" },
    });

    if (!otp || otp.expiresAt < new Date()) {
      return res.status(400).json({ data: null, error: "Invalid or expired 6-digit code" });
    }

    await prisma.$transaction([
      prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } }),
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
    ]);

    // Issue JWT session automatically on verification for instant login UX
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
        message: "Identity verified successfully!",
      },
      error: null,
    });
  } catch (err) {
    return next(err);
  }
});

authRouter.post("/verify-email", async (req, res, next) => {
  // Alias to /verify
  return (authRouter as any).handle(Object.assign(req, { url: "/verify" }), res, next);
});

// ---------- Resend OTP ----------
authRouter.post("/resend-otp", async (req, res, next) => {
  try {
    const { email, phone, identifier } = req.body;
    const target = email || phone || identifier;
    if (!target) {
      return res.status(400).json({ data: null, error: "Email or phone is required" });
    }

    const isEmail = target.includes("@") && !target.endsWith("@whatsapp.truehire.dev");
    const targetEmail = isEmail
      ? target.toLowerCase().trim()
      : `${normalizePhoneNumber(target)}@whatsapp.truehire.dev`;

    const user = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!user) {
      return res.json({ data: { message: "If that account exists, a new code has been sent." }, error: null });
    }

    const { code, codeHash } = generateOtp();
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        codeHash,
        purpose: "verify_email",
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    if (isEmail) {
      await sendOtpEmail(user.email, code, "verify_email");
    } else {
      const cleanPhone = normalizePhoneNumber(target);
      await sendOtpWhatsApp({ toPhone: cleanPhone, code, purpose: "login_otp" });
    }

    return res.json({ data: { message: "New verification code sent successfully." }, error: null });
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
    const user = await prisma.user.findUnique({ where: { email } });

    // Same generic error whether the email doesn't exist or the password is wrong —
    // prevents attackers from enumerating valid accounts.
    const genericError = { data: null, error: "Invalid email or password" };
    if (!user) return res.status(401).json(genericError);

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) return res.status(401).json(genericError);

    if (!user.emailVerified) {
      return res.status(403).json({ data: null, error: "Please verify your email before logging in" });
    }

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
      data: { accessToken, user: { id: user.id, email: user.email, role: user.role } },
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

// ---------- Current user (used by frontend to bootstrap session state) ----------
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
