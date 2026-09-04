import crypto from "crypto";
import bcrypt from "bcryptjs";

export function generateOtp(): string {
  // 6-digit numeric code
  return String(crypto.randomInt(100_000, 1_000_000));
}

export function hashOtp(code: string) {
  return bcrypt.hash(code, 8);
}

export function verifyOtp(code: string, hash: string) {
  return bcrypt.compare(code, hash);
}

// Return the OTP in the API response only in non-production, so devs can
// signup without SMTP creds. Never expose in production.
export function shouldReturnOtpInResponse() {
  return process.env.NODE_ENV !== "production" && !process.env.SMTP_USER;
}

// Simple in-memory rate limit — good enough for a college project and a single
// serverless region. For real prod, back with Redis.
const bucket = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryInSec: number } {
  const now = Date.now();
  const entry = bucket.get(key);
  if (!entry || entry.resetAt < now) {
    bucket.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryInSec: 0 };
  }
  if (entry.count >= max) {
    return { ok: false, retryInSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true, retryInSec: 0 };
}
