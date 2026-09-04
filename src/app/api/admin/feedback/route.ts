import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { dbConnect } from "@/lib/db";
import { Feedback } from "@/models/Feedback";

const STATUS = ["new", "read", "in_progress", "resolved", "archived"] as const;
const CATEGORIES = ["bug", "suggestion", "praise", "feature", "other"] as const;

export async function GET(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  const starredOnly = url.searchParams.get("starred") === "1";
  const q: Record<string, unknown> = {};
  if (status && STATUS.includes(status as (typeof STATUS)[number])) q.status = status;
  if (category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])) q.category = category;
  if (starredOnly) q.starred = true;

  const rows = await Feedback.find(q).sort({ createdAt: -1 }).limit(200).lean().exec();

  const total = await Feedback.countDocuments({}).exec();
  const stats = {
    total,
    byStatus: Object.fromEntries(
      await Promise.all(STATUS.map(async (s) => [s, await Feedback.countDocuments({ status: s }).exec()]))
    ),
    avgRating:
      total > 0
        ? Math.round(
            (
              (await Feedback.aggregate([{ $group: { _id: null, avg: { $avg: "$rating" } } }]).exec())[0]?.avg ?? 0
            ) * 10
          ) / 10
        : 0,
  };

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      email: r.email ?? null,
      phone: r.phone ?? null,
      state: r.state ?? null,
      district: r.district ?? null,
      category: r.category,
      rating: r.rating,
      message: r.message,
      status: r.status,
      starred: !!r.starred,
      adminNote: r.adminNote ?? "",
      createdAt: r.createdAt,
      userId: r.userId ? String(r.userId) : null,
    })),
    stats,
  });
}
