import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAdminSession } from "@/lib/adminAuth";
import { dbConnect } from "@/lib/db";
import { ActivityLog } from "@/models/ActivityLog";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "Bad id" }, { status: 400 });

  await dbConnect();
  const url = new URL(req.url);
  const limit = Math.min(500, Number(url.searchParams.get("limit") || 100));
  const action = url.searchParams.get("action");
  const q: Record<string, unknown> = { userId: id };
  if (action) q.action = action;

  const rows = await ActivityLog.find(q).sort({ createdAt: -1 }).limit(limit).lean().exec();
  return NextResponse.json({
    items: rows.map((r) => ({
      id: String(r._id),
      action: r.action,
      meta: r.meta ?? {},
      ip: r.ip ?? null,
      userAgent: r.userAgent ?? null,
      createdAt: r.createdAt,
    })),
  });
}
