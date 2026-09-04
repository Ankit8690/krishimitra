import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { advise } from "@/lib/fertilizer";
import { logActivity } from "@/lib/activity";

const Body = z.object({
  cropName: z.string().min(2),
  currentN: z.number().min(0).max(400),
  currentP: z.number().min(0).max(300),
  currentK: z.number().min(0).max(300),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const result = advise(parsed.data);
  if (!result) return NextResponse.json({ error: "Unknown crop" }, { status: 404 });
  logActivity(session.sub, "ml.fertilizer_advise", { crop: parsed.data.cropName });
  return NextResponse.json({ advice: result });
}
