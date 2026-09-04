import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { getAdminSession } from "@/lib/adminAuth";
import { dbConnect } from "@/lib/db";
import { Feedback } from "@/models/Feedback";

const Patch = z.object({
  status: z.enum(["new", "read", "in_progress", "resolved", "archived"]).optional(),
  starred: z.boolean().optional(),
  adminNote: z.string().max(2000).optional(),
});

async function requireAdmin() {
  const admin = await getAdminSession();
  if (!admin) return null;
  return admin;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const parsed = Patch.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await dbConnect();
  const updated = await Feedback.findByIdAndUpdate(id, parsed.data, { new: true }).lean().exec();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  await dbConnect();
  await Feedback.findByIdAndDelete(id).exec();
  return NextResponse.json({ ok: true });
}
