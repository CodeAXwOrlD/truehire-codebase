import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
});

export async function sendOtpEmail(to: string, code: string, purpose: "verify_email" | "reset_password") {
  const subject =
    purpose === "verify_email" ? "Verify your TrueHire email" : "Reset your TrueHire password";

  const body =
    purpose === "verify_email"
      ? `Your TrueHire verification code is ${code}. It expires in 10 minutes.`
      : `Your TrueHire password reset code is ${code}. It expires in 10 minutes. If you didn't request this, ignore this email.`;

  if (!env.smtpHost) {
    // Dev fallback — no SMTP configured yet, log instead of failing the request.
    console.warn(`[mailer] SMTP not configured. Would send to ${to}: ${body}`);
    return;
  }

  await transporter.sendMail({
    from: env.mailFrom,
    to,
    subject,
    text: body,
  });
}
