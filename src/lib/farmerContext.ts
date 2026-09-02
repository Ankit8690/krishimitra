import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { getWeather, weatherLabel } from "@/lib/weather";
import { geocode } from "@/lib/geocode";
import { fetchMandi, bestMarketsByCommodity } from "@/lib/mandi";
import { rankedSchemes } from "@/lib/schemes";
import { inr } from "@/lib/format";
import { findLanguage, languageInstruction, type ChatLangCode } from "@/lib/languages";

// Assemble a compact system-prompt string with the farmer's live context.
// This is what makes the chatbot answer with real numbers instead of guesses.

export type ContextResult = {
  system: string;
  farmerName: string;
  language: ChatLangCode;
};

export async function buildFarmerContext(
  userId: string,
  languageOverride?: ChatLangCode
): Promise<ContextResult> {
  await dbConnect();
  const user = await User.findById(userId).exec();
  if (!user) throw new Error("User not found");

  const stored =
    (user.chatPrefs?.chatLanguage as ChatLangCode | undefined) ??
    (user.preferredLanguage as ChatLangCode | undefined) ??
    "en";
  const language = findLanguage(languageOverride ?? stored).code;
  const parts: string[] = [];

  parts.push(
    `You are KrishiMitra, an AI farming assistant for Indian smallholder farmers. Respond ONLY in ${languageInstruction(language)}. Be concise, friendly, and specific with numbers (₹, °C, kg/ha).

STRICT RULES — READ CAREFULLY:
1. NEVER invent numbers. If a specific statistic (acreage, production volume, yield, price, subsidy amount, historical figure) is not in the data below, say "I don't have that number" and suggest an official source. Do not guess.
2. NEVER conflate different things: PRICE (₹/quintal from mandi) is NOT the same as VOLUME SOLD, PRODUCTION, or ACREAGE. If asked about "highest selling", "most produced", "most grown", or "biggest crop" — clarify that you only have TODAY'S PRICES, not volume or acreage data.
3. WEATHER and MANDI PRICES data below are ONLY for the farmer's own location/state. If the user asks about a different state or district (e.g., Kerala when the farmer is in Punjab), say so explicitly and point them to IMD (weather) or e-NAM (prices).
4. If the user's message is very short (1-3 words), garbled, ambiguous, or seems like a partial voice transcription, DO NOT guess — politely ask them to rephrase in one sentence.
5. If the user's message is off-topic (not about farming) or contains inappropriate content, respond neutrally with "I can only help with farming questions. What would you like to know about your crops, prices, weather, or a scheme?"
6. Cite the exact market and state when quoting a price: "Wheat is ₹2,340/qtl at Khanna, Punjab today". Never say "in India" or "everywhere" — you only have specific market snapshots.`
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

  // Mandi prices block — broader snapshot so the LLM isn't biased to one crop
  try {
    const crops = user.farm?.primaryCrops ?? [];
    const state = user.location?.state;
    if (state) {
      // Two-part fetch: state-wide top 200 records + farmer's specific crops.
      // Combining these keeps the farmer's crops guaranteed present, but also
      // gives the LLM visibility into 15-20 other crops so questions like
      // "highest priced crop" don't always collapse to one answer.
      const [stateWide, cropSpecific] = await Promise.all([
        fetchMandi({ state, limit: 200 }).catch(() => []),
        crops.length > 0
          ? Promise.all(
              crops
                .slice(0, 5)
                .map((c) => fetchMandi({ state, commodity: c, limit: 30 }).catch(() => []))
            ).then((arr) => arr.flat())
          : Promise.resolve([]),
      ]);
      const all = [...cropSpecific, ...stateWide];
      const best = bestMarketsByCommodity(all).slice(0, 20);
      if (best.length > 0) {
        const lines = best.map(
          (r) => `- ${r.commodity}: ₹${r.modalPrice}/qtl at ${r.market}, ${r.state} (range ₹${r.minPrice}–₹${r.maxPrice})`
        );
        parts.push(
          `TODAY'S MANDI PRICES for ${state} (top ${best.length} commodities by modal price — this is a SNAPSHOT, not the complete state-wide market):\n${lines.join(
            "\n"
          )}\n\nThe farmer's own crops are: ${
            crops.length ? crops.join(", ") : "not set yet"
          }.`
        );
      } else {
        parts.push(
          `MANDI PRICES: The government data.gov.in feed has no records for ${state} today. Suggest e-NAM or the local APMC.`
        );
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
    `RESPONSE GUIDELINES:
- Answer using ONLY the data above. If the answer isn't there, admit it and point to an official source (IMD for weather, e-NAM for prices, the scheme's URL for details).
- Keep answers under 120 words unless a step-by-step is needed. Be direct.
- For scheme questions, state the eligibility status (from the data) and the application steps.
- For crop-planning questions, factor in the farmer's soil, water source, current season, and today's weather.
- Never invent phone numbers, office addresses, exact acreage, or production numbers.
- If asked about a state/district not covered by the data above, say so clearly and point to enam.gov.in or mausam.imd.gov.in.
- If asked "most grown crop" / "most produced" / "biggest crop", explicitly say you only have PRICE data, not acreage/volume, then suggest the farmer check the state's Agriculture Department for those statistics.`
  );

  return {
    system: parts.join("\n\n"),
    farmerName: user.name,
    language,
  };
}
