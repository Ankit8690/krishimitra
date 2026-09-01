import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";

const Body = z.object({
  location: z.object({
    lat: z.number().optional(),
    lon: z.number().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
  }),
  farm: z.object({
    landSizeAcres: z.number().min(0).max(10000),
    soilType: z.enum([
      "black",
      "red",
      "sandy",
      "loamy",
      "clay",
      "alluvial",
      "unknown",
    ]),
    irrigation: z.enum([
      "borewell",
      "canal",
      "rainfed",
      "drip",
      "sprinkler",
      "unknown",
    ]),
    primaryCrops: z.array(z.string()).max(20),
  }),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  await dbConnect();
  const user = await User.findByIdAndUpdate(
    session.sub,
    {
      location: parsed.data.location,
      farm: parsed.data.farm,
      onboardingCompleted: true,
    },
    { new: true }
  ).exec();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
