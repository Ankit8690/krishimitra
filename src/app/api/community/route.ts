import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Post } from "@/models/Post";

const TYPES = ["equipment", "seed", "labour", "produce", "other"] as const;

const Body = z.object({
  type: z.enum(TYPES),
  title: z.string().min(3).max(120),
  body: z.string().min(3).max(2000),
  contact: z.string().max(60).optional(),
  priceInr: z.number().min(0).max(10_000_000).optional(),
});

export async function GET(req: Request) {
  await dbConnect();
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const state = url.searchParams.get("state");
  const q: Record<string, unknown> = {};
  if (type && TYPES.includes(type as (typeof TYPES)[number])) q.type = type;
  if (state) q.state = state;

  const rows = await Post.find(q).sort({ createdAt: -1 }).limit(60).lean().exec();
  const session = await getSession();
  const meId = session?.sub;
  return NextResponse.json({
    posts: rows.map((p) => ({
      id: p._id.toString(),
      type: p.type,
      title: p.title,
      body: p.body,
      contact: p.contact ?? null,
      priceInr: p.priceInr ?? null,
      author: p.authorName,
      state: p.state ?? null,
      district: p.district ?? null,
      createdAt: p.createdAt,
      isMine: meId ? p.userId.toString() === meId : false,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await dbConnect();
  const user = await User.findById(session.sub).exec();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const post = await Post.create({
    userId: session.sub,
    authorName: user.name,
    type: parsed.data.type,
    title: parsed.data.title,
    body: parsed.data.body,
    contact: parsed.data.contact ?? user.phone,
    priceInr: parsed.data.priceInr,
    state: user.location?.state,
    district: user.location?.district,
  });
  return NextResponse.json({ id: post._id.toString() });
}
