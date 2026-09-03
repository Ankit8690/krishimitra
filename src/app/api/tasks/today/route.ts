import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { todaysTasks } from "@/lib/cropCalendar";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const user = await User.findById(session.sub).exec();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const lang = (user.preferredLanguage as "en" | "hi" | "pa") ?? "en";
  const crops = (user.farm?.primaryCrops ?? []) as string[];
  const sowing = (user.farm?.sowingDates ?? new Map()) as Map<string, string>;

  const items = crops.map((crop) => ({
    crop,
    sowingDate: sowing instanceof Map ? sowing.get(crop) : (sowing as Record<string, string>)[crop],
  }));
  const tasks = todaysTasks(items, lang);
  return NextResponse.json({ tasks });
}
