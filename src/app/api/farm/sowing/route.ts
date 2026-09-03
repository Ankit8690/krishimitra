import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";

const Body = z.object({
  crop: z.string().min(1).max(60),
  sowingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // yyyy-mm-dd
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await dbConnect();
  await User.updateOne(
    { _id: session.sub },
    { $set: { [`farm.sowingDates.${parsed.data.crop}`]: parsed.data.sowingDate } }
  ).exec();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const crop = url.searchParams.get("crop");
  if (!crop) return NextResponse.json({ error: "Missing crop" }, { status: 400 });
  await dbConnect();
  await User.updateOne(
    { _id: session.sub },
    { $unset: { [`farm.sowingDates.${crop}`]: "" } }
  ).exec();
  return NextResponse.json({ ok: true });
}
