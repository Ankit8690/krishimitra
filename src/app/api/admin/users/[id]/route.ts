import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { getAdminSession } from "@/lib/adminAuth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { ActivityLog } from "@/models/ActivityLog";
import { ChatMessage } from "@/models/ChatMessage";
import { ChatSession } from "@/models/ChatSession";
import { Post } from "@/models/Post";
import { Feedback } from "@/models/Feedback";

const Patch = z.object({
  disabled: z.boolean().optional(),
});

async function requireAdmin() {
  return (await getAdminSession()) ?? null;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "Bad id" }, { status: 400 });

  await dbConnect();
  const u = await User.findById(id).lean().exec();
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [activityCount, chatMsgCount, chatSessionCount, postCount, feedbackCount] = await Promise.all([
    ActivityLog.countDocuments({ userId: id }).exec(),
    ChatMessage.countDocuments({ userId: id }).exec(),
    ChatSession.countDocuments({ userId: id }).exec(),
    Post.countDocuments({ userId: id }).exec(),
    Feedback.countDocuments({ userId: id }).exec(),
  ]);

  // Breakdown of activity by action
  const byAction = await ActivityLog.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(id) } },
    { $group: { _id: "$action", count: { $sum: 1 }, lastAt: { $max: "$createdAt" } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]).exec();

  return NextResponse.json({
    user: {
      id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone ?? null,
      emailVerified: !!u.emailVerified,
      disabled: !!u.disabled,
      preferredLanguage: u.preferredLanguage,
      onboardingCompleted: !!u.onboardingCompleted,
      location: u.location ?? null,
      farm: u.farm ?? null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    },
    stats: {
      activityCount,
      chatMsgCount,
      chatSessionCount,
      postCount,
      feedbackCount,
    },
    byAction: byAction.map((a) => ({ action: a._id, count: a.count, lastAt: a.lastAt })),
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const parsed = Patch.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await dbConnect();
  const u = await User.findByIdAndUpdate(id, parsed.data, { new: true }).lean().exec();
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "Bad id" }, { status: 400 });

  await dbConnect();
  // Cascade: remove user + their derived rows
  await Promise.all([
    User.findByIdAndDelete(id).exec(),
    ActivityLog.deleteMany({ userId: id }).exec(),
    ChatMessage.deleteMany({ userId: id }).exec(),
    ChatSession.deleteMany({ userId: id }).exec(),
    Post.deleteMany({ userId: id }).exec(),
    Feedback.deleteMany({ userId: id }).exec(),
  ]);
  return NextResponse.json({ ok: true });
}
