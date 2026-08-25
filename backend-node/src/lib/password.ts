import bcrypt from "bcrypt";
import crypto from "node:crypto";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Generates a 6-digit numeric OTP and returns both the plaintext (to email/send)
 * and a SHA-256 hash (to store). We never store the plaintext code — same
 * principle as passwords, so a DB leak alone can't be used to verify accounts.
 */
export function generateOtp(): { code: string; codeHash: string } {
  const code = crypto.randomInt(100000, 999999).toString();
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  return { code, codeHash };
}

export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/** Generates an opaque refresh token (not a JWT) + its hash for DB storage. */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(48).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}
