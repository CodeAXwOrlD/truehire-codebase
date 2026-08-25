import rateLimit from "express-rate-limit";

// Blunts brute-force / credential-stuffing on auth endpoints.
// 5 attempts per 15 minutes per IP — tune once real traffic patterns exist.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30, // Relaxed for local dev testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, error: "Too many attempts. Please try again later." },
});

// Looser general-purpose limiter for the rest of the API.
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, error: "Too many requests. Please slow down." },
});
