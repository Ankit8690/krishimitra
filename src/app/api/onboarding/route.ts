import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { logActivity } from "@/lib/activity";

const Body = z.object({
  location: z.object({
    lat: z.number().optional(),
    lon: z.number().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
  }),
  farm: z.object({
    landSizeAcres: z.number().min(0).max(10000),
    // Free-form: recommended values still work but farmer can type their own
    soilType: z.string().min(1).max(60),
    irrigation: z.string().min(1).max(60),
    primaryCrops: z.array(z.string().min(1).max(60)).max(20),
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
  logActivity(session.sub, "onboarding.completed", {
    state: parsed.data.location.state,
    district: parsed.data.location.district,
    crops: parsed.data.farm.primaryCrops,
  });
  return NextResponse.json({ ok: true });
}
