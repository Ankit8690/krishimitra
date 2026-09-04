import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";

export async function GET() {
  const admin = await getAdminSession();
  return NextResponse.json({ admin: admin ? { email: admin.email } : null });
}
