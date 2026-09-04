import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { scoreCrops, withProfit } from "@/lib/cropRec";
import { mlEnrichScores, mlPredictYields, cropMLStatus } from "@/lib/cropRecML";
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

  // 1. Baseline: rule-based scorer (always runs so we keep fit/misfit reasons)
  const baseScores = scoreCrops(parsed.data);

  // 2. Resolve farmer's state/district for the ML endpoints + mandi lookup
  let state = parsed.data.state;
  let district: string | undefined;
  if (!state || !district) {
    await dbConnect();
    const user = await User.findById(session.sub).exec();
    state = state ?? user?.location?.state ?? undefined;
    district = user?.location?.district ?? undefined;
  }

  // 3. Fire ML enrichment + mandi fetch in parallel — total wall time = max()
  const [mlScored, priceMap] = await Promise.all([
    mlEnrichScores(parsed.data, district, state, baseScores),
    (async () => {
      const map = new Map<string, number>();
      if (!state) return map;
      try {
        const top = baseScores.slice(0, 8);
        const records = await Promise.all(
          top.map((s) =>
            fetchMandi({ state, commodity: s.crop.name, limit: 20 }).catch(() => [])
          )
        );
        for (const list of records) {
          for (const r of list) {
            const key = r.commodity.toLowerCase();
            const prev = map.get(key);
            if (!prev || r.modalPrice > prev) map.set(key, r.modalPrice);
          }
        }
      } catch (err) {
        console.warn("[ml/crop] price fetch failed", err);
      }
      return map;
    })(),
  ]);

  const scores = mlScored ?? baseScores;
  const top = scores.slice(0, 8);

  // 4. Ask ML yield regressor for personalised yields (only for top crops)
  const yieldOverrides = await mlPredictYields(
    parsed.data,
    district,
    state,
    top.map((s) => s.crop.name)
  );

  // 5. Merge everything into profit-ranked recommendations
  const recommendations = withProfit(top, priceMap, yieldOverrides).sort((a, b) => {
    const ap = a.profitPerAcre ?? -1;
    const bp = b.profitPerAcre ?? -1;
    if (ap === bp) return b.matchScore - a.matchScore;
    return bp - ap;
  });

  const status = cropMLStatus();
  logActivity(session.sub, "ml.crop_recommend", {
    input: parsed.data,
    top: recommendations.slice(0, 3).map((r) => r.cropName),
    engine: status,
  });

  return NextResponse.json({
    recommendations,
    priceStateUsed: state ?? null,
    engine: status,
  });
}
