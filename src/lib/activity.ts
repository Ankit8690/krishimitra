import type { ActivityAction } from "@/models/ActivityLog";
import { ActivityLog } from "@/models/ActivityLog";
import { dbConnect } from "./db";
import { headers } from "next/headers";

// Fire-and-forget activity logger. Never throws — a logging failure must never
// break the actual API operation. Meta is small structured data (already
// filtered to strip PII/large blobs at the call site).
export async function logActivity(
  userId: string | null | undefined,
  action: ActivityAction | string,
  meta: Record<string, unknown> = {}
) {
  if (!userId) return;
  try {
    await dbConnect();
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0].trim() ||
      h.get("x-real-ip") ||
      undefined;
    const userAgent = h.get("user-agent") || undefined;
    await ActivityLog.create({ userId, action, meta, ip, userAgent });
  } catch (err) {
    console.warn("[activity] log failed", err);
  }
}
