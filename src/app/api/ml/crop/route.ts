import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { scoreCrops, withProfit } from "@/lib/cropRec";
import { fetchMandi } from "@/lib/mandi";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { logActivity } from "@/lib/activity";

const Body = z.object({
  n: z.number().min(0).max(400),
  p: z.number().min(0).max(300),
  k: z.number().min(0).max(300),
  temperatureC: z.number().min(-10).max(60),
  humidityPct: z.number().min(0).max(100),
  ph: z.number().min(3).max(10),
  rainfallMm: z.number().min(0).max(4000),
  state: z.string().optional(),
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

  const scores = scoreCrops(parsed.data);
  const top = scores.slice(0, 8);

  let state = parsed.data.state;
  if (!state) {
    await dbConnect();
    const user = await User.findById(session.sub).exec();
    state = user?.location?.state ?? undefined;
  }

  const priceMap = new Map<string, number>();
  if (state) {
    try {
      const records = await Promise.all(
        top.map((s) =>
          fetchMandi({ state, commodity: s.crop.name, limit: 20 }).catch(() => [])
        )
      );
      for (const list of records) {
        for (const r of list) {
          const key = r.commodity.toLowerCase();
          const prev = priceMap.get(key);
          if (!prev || r.modalPrice > prev) priceMap.set(key, r.modalPrice);
        }
      }
    } catch (err) {
      console.warn("[ml/crop] price fetch failed", err);
    }
  }

  const recommendations = withProfit(top, priceMap).sort((a, b) => {
    // Rank primarily by profit (when known), secondarily by match score.
    const ap = a.profitPerAcre ?? -1;
    const bp = b.profitPerAcre ?? -1;
    if (ap === bp) return b.matchScore - a.matchScore;
    return bp - ap;
  });

  logActivity(session.sub, "ml.crop_recommend", {
    input: parsed.data,
    top: recommendations.slice(0, 3).map((r) => r.cropName),
  });

  return NextResponse.json({ recommendations, priceStateUsed: state ?? null });
}
