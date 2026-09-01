import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { fetchMandi, bestMarketsByCommodity } from "@/lib/mandi";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const state = url.searchParams.get("state") ?? undefined;
  const district = url.searchParams.get("district") ?? undefined;
  const commodity = url.searchParams.get("commodity") ?? undefined;
  const mode = url.searchParams.get("mode") ?? "list";
  const cropsParam = url.searchParams.get("crops");

  let filterState = state;
  let crops = cropsParam ? cropsParam.split(",").map((s) => s.trim()).filter(Boolean) : [];

  if (!filterState || crops.length === 0) {
    await dbConnect();
    const user = await User.findById(session.sub).exec();
    if (user) {
      if (!filterState) filterState = user.location?.state ?? undefined;
      if (crops.length === 0) crops = user.farm?.primaryCrops ?? [];
    }
  }

  try {
    if (mode === "best" && crops.length > 0) {
      // Fetch once per commodity, then pick the best market per commodity.
      const all = (
        await Promise.all(
          crops.map((c) => fetchMandi({ state: filterState, commodity: c, limit: 100 }))
        )
      ).flat();
      const best = bestMarketsByCommodity(all).slice(0, 10);
      return NextResponse.json({ records: best, mode });
    }

    const records = await fetchMandi({
      state: filterState,
      district,
      commodity,
      limit: 500,
    });
    return NextResponse.json({ records, mode });
  } catch (err) {
    console.error("[mandi] error", err);
    return NextResponse.json({ error: "Mandi service failed" }, { status: 502 });
  }
}
