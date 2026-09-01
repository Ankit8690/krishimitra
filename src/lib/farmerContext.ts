import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { getWeather, weatherLabel } from "@/lib/weather";
import { geocode } from "@/lib/geocode";
import { fetchMandi, bestMarketsByCommodity } from "@/lib/mandi";
import { rankedSchemes } from "@/lib/schemes";
import { inr } from "@/lib/format";

// Assemble a compact system-prompt string with the farmer's live context.
// This is what makes the chatbot answer with real numbers instead of guesses.

export type ContextResult = {
  system: string;
  farmerName: string;
  language: "en" | "hi" | "pa";
};

const LANG_NAMES: Record<"en" | "hi" | "pa", string> = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  pa: "Punjabi (ਪੰਜਾਬੀ)",
};

export async function buildFarmerContext(userId: string): Promise<ContextResult> {
  await dbConnect();
  const user = await User.findById(userId).exec();
  if (!user) throw new Error("User not found");

  const language: "en" | "hi" | "pa" =
    (user.preferredLanguage as "en" | "hi" | "pa") ?? "en";
  const parts: string[] = [];

  parts.push(
    `You are KrishiMitra, an AI farming assistant for Indian smallholder farmers. Respond ONLY in ${LANG_NAMES[language]}. Be concise, friendly, and specific with numbers (₹, °C, kg/ha). If you don't know something, say so — do not invent government prices, subsidies, or agronomy facts.`
  );

  // Farmer profile block
  const profile: string[] = [];
  profile.push(`Name: ${user.name}`);
  if (user.location?.district || user.location?.state) {
    profile.push(
      `Location: ${[user.location?.district, user.location?.state].filter(Boolean).join(", ")}`
    );
  }
  if (user.farm?.landSizeAcres) profile.push(`Land: ${user.farm.landSizeAcres} acres`);
  if (user.farm?.soilType && user.farm.soilType !== "unknown")
    profile.push(`Soil: ${user.farm.soilType}`);
  if (user.farm?.irrigation && user.farm.irrigation !== "unknown")
    profile.push(`Irrigation: ${user.farm.irrigation}`);
  if (user.farm?.primaryCrops && user.farm.primaryCrops.length > 0)
    profile.push(`Crops: ${user.farm.primaryCrops.join(", ")}`);
  parts.push(`FARMER PROFILE:\n${profile.join("\n")}`);

  // Weather block — best-effort, may fail
  try {
    let lat = user.location?.lat;
    let lon = user.location?.lon;
    if ((lat == null || lon == null) && user.location?.district && user.location?.state) {
      const geo = await geocode(user.location.district, user.location.state);
      if (geo) {
        lat = geo.lat;
        lon = geo.lon;
      }
    }
    if (lat != null && lon != null) {
      const wx = await getWeather(lat, lon);
      const today = wx.daily[0];
      parts.push(
        `TODAY'S WEATHER: ${Math.round(wx.current.tempC)}°C, ${Math.round(wx.current.humidity)}% humidity, ${weatherLabel(wx.current.weatherCode)}. Today high/low ${Math.round(today.tempMax)}°/${Math.round(today.tempMin)}°, rain probability ${Math.round(today.rainProb)}%. Spray advisory: ${wx.sprayAdvice.ok ? "SAFE to spray" : "DO NOT SPRAY"} — ${wx.sprayAdvice.reason}.`
      );
    }
  } catch (err) {
    console.warn("[farmerContext] weather failed", err);
  }

  // Mandi prices block for farmer's crops
  try {
    const crops = user.farm?.primaryCrops ?? [];
    const state = user.location?.state;
    if (crops.length > 0 && state) {
      const all = (
        await Promise.all(
          crops
            .slice(0, 5)
            .map((c) => fetchMandi({ state, commodity: c, limit: 30 }).catch(() => []))
        )
      ).flat();
      const best = bestMarketsByCommodity(all).slice(0, 5);
      if (best.length > 0) {
        const lines = best.map(
          (r) => `- ${r.commodity}: ${inr(r.modalPrice)}/qtl at ${r.market}, ${r.state} (range ${inr(r.minPrice)}–${inr(r.maxPrice)})`
        );
        parts.push(`TODAY'S BEST MANDI PRICES FOR FARMER'S CROPS:\n${lines.join("\n")}`);
      }
    }
  } catch (err) {
    console.warn("[farmerContext] mandi failed", err);
  }

  // Schemes block — pass all with eligibility
  try {
    const schemes = rankedSchemes({
      state: user.location?.state ?? undefined,
      landAcres: user.farm?.landSizeAcres ?? undefined,
      landOwner: true,
      crops: (user.farm?.primaryCrops as string[] | undefined) ?? [],
    });
    const lines = schemes.map(
      (s) =>
        `- ${s.shortName} (${s.eligible ? "eligible" : "not eligible"}): ${s.name} — ${s.benefit}. Apply: ${s.url}`
    );
    parts.push(
      `GOVERNMENT SCHEMES (eligibility computed from farmer's profile):\n${lines.join("\n")}`
    );
  } catch (err) {
    console.warn("[farmerContext] schemes failed", err);
  }

  parts.push(
    `INSTRUCTIONS:
- Answer the farmer's question using the data above wherever possible.
- Cite actual numbers (temperatures, prices, benefit amounts) — don't say "check the mandi", say "wheat is ₹2,340/qtl at Khanna today".
- For scheme questions, give the eligibility status and how to apply.
- For crop-planning questions, factor in the farmer's soil, water source, and this season.
- Keep answers under 120 words unless a step-by-step is needed.
- Never invent phone numbers or exact office addresses. Point to the official URL provided.`
  );

  return {
    system: parts.join("\n\n"),
    farmerName: user.name,
    language,
  };
}
