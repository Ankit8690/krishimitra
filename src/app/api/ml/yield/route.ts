import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { estimateYield } from "@/lib/yieldPredict";

const Body = z.object({
  cropName: z.string().min(2),
  n: z.number().min(0).max(400),
  p: z.number().min(0).max(300),
  k: z.number().min(0).max(300),
  temperatureC: z.number().min(-10).max(60),
  humidityPct: z.number().min(0).max(100),
  ph: z.number().min(3).max(10),
  rainfallMm: z.number().min(0).max(4000),
  irrigation: z
    .enum(["borewell", "canal", "rainfed", "drip", "sprinkler", "unknown"])
    .optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const est = estimateYield(parsed.data);
  if (!est) return NextResponse.json({ error: "Unknown crop" }, { status: 404 });
  return NextResponse.json({ estimate: est });
}
