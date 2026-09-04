import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST() {
  const s = await getSession();
  if (s) logActivity(s.sub, "auth.logout", {});
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
