import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { cacheMode } from "@/lib/cache";
import { isEmailConfigured } from "@/lib/mailer";

export async function GET() {
  const admin = await getAdminSession();
  return NextResponse.json({
    admin: admin ? { email: admin.email } : null,
    system: {
      cache: cacheMode(),
      smtpConfigured: isEmailConfigured(),
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
