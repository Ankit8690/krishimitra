import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Feedback } from "@/models/Feedback";
import { logActivity } from "@/lib/activity";

const CATEGORIES = ["bug", "suggestion", "praise", "feature", "other"] as const;

const Body = z.object({
  category: z.enum(CATEGORIES),
  rating: z.number().int().min(1).max(5),
  message: z.string().min(5).max(3000),
  email: z.string().email().max(120).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findById(session.sub).exec();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const doc = await Feedback.create({
    userId: session.sub,
    name: user.name,
    email: parsed.data.email || user.email,
    phone: user.phone,
    state: user.location?.state,
    district: user.location?.district,
    category: parsed.data.category,
    rating: parsed.data.rating,
    message: parsed.data.message,
  });

  logActivity(session.sub, "feedback.submitted", {
    category: parsed.data.category,
    rating: parsed.data.rating,
  });

  return NextResponse.json({ id: doc._id.toString() });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const rows = await Feedback.find({ userId: session.sub })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()
    .exec();
  return NextResponse.json({
    items: rows.map((r) => ({
      id: r._id.toString(),
      category: r.category,
      rating: r.rating,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt,
    })),
  });
}
