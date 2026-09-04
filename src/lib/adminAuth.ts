import jwt, { SignOptions } from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.JWT_SECRET || "dev-only-change-me";
const ADMIN_COOKIE = "km_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

type AdminPayload = { role: "admin"; email: string };

export function getAdminCreds() {
  return {
    email: (process.env.ADMIN_EMAIL || "").toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "",
  };
}

export function signAdminToken(email: string) {
  const opts: SignOptions = { expiresIn: MAX_AGE_SECONDS };
  return jwt.sign({ role: "admin", email } satisfies AdminPayload, SECRET, opts);
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    const p = jwt.verify(token, SECRET) as AdminPayload;
    return p.role === "admin" ? p : null;
  } catch {
    return null;
  }
}

export async function setAdminCookie(token: string) {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function getAdminSession(): Promise<AdminPayload | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
