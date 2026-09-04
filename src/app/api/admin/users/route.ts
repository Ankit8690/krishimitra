import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { ActivityLog } from "@/models/ActivityLog";

export async function GET(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const status = url.searchParams.get("status") || "all"; // all | active | disabled
  const limit = Math.min(200, Number(url.searchParams.get("limit") || 50));

  const query: Record<string, unknown> = {};
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  if (status === "active") query.disabled = { $ne: true };
  if (status === "disabled") query.disabled = true;

  const rows = await User.find(query).sort({ createdAt: -1 }).limit(limit).lean().exec();

  // Bulk activity counts for each user
  const ids = rows.map((r) => r._id);
  const counts = ids.length
    ? await ActivityLog.aggregate([
        { $match: { userId: { $in: ids } } },
        {
          $group: {
            _id: "$userId",
            count: { $sum: 1 },
            lastAt: { $max: "$createdAt" },
          },
        },
      ]).exec()
    : [];
  const countMap = new Map<string, { count: number; lastAt: Date }>();
  for (const c of counts) countMap.set(String(c._id), { count: c.count, lastAt: c.lastAt });

  const total = await User.countDocuments(query).exec();
  const active = await User.countDocuments({ disabled: { $ne: true } }).exec();
  const disabled = await User.countDocuments({ disabled: true }).exec();

  return NextResponse.json({
    stats: { total, active, disabled },
    users: rows.map((u) => {
      const stat = countMap.get(String(u._id));
      return {
        id: String(u._id),
        name: u.name,
        email: u.email,
        phone: u.phone ?? null,
        emailVerified: !!u.emailVerified,
        preferredLanguage: u.preferredLanguage,
        disabled: !!u.disabled,
        onboardingCompleted: !!u.onboardingCompleted,
        state: u.location?.state ?? null,
        district: u.location?.district ?? null,
        primaryCrops: u.farm?.primaryCrops ?? [],
        createdAt: u.createdAt,
        activityCount: stat?.count ?? 0,
        lastActivityAt: stat?.lastAt ?? null,
      };
    }),
  });
}
