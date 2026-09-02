import type { Tool } from "@/lib/groq";
import { fetchMandi, bestMarketsByCommodity } from "@/lib/mandi";
import { getWeather, weatherLabel } from "@/lib/weather";
import { geocode } from "@/lib/geocode";
import { inr } from "@/lib/format";

// Tools the LLM can call to fetch fresh data for any Indian state/district.
export const CHAT_TOOLS: Tool[] = [
  {
    type: "function",
    function: {
      name: "get_mandi_prices",
      description:
        "Look up today's mandi (APMC) prices from the Government of India data.gov.in feed for any Indian state. Optionally filter by a specific crop (commodity). Returns up to 20 markets sorted by modal price. Use whenever the user asks about crop prices in a state or district you don't already have data for.",
      parameters: {
        type: "object",
        properties: {
          state: {
            type: "string",
            description:
              "Indian state name in Title Case, e.g. 'Rajasthan', 'Uttar Pradesh', 'Tamil Nadu'.",
          },
          commodity: {
            type: "string",
            description:
              "Optional single crop name in Title Case, e.g. 'Wheat', 'Onion', 'Cotton'. Omit for all crops.",
          },
        },
        required: ["state"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weather",
      description:
        "Fetch today's weather (current temperature/humidity/wind + 7-day forecast + spray-safety advice) for any Indian district. Use whenever the user asks about weather, rain, or spraying conditions in a location you don't already have data for.",
      parameters: {
        type: "object",
        properties: {
          district: {
            type: "string",
            description: "District name, e.g. 'Sikar', 'Ludhiana', 'Thiruvananthapuram'.",
          },
          state: {
            type: "string",
            description: "The state that district belongs to, e.g. 'Rajasthan'.",
          },
        },
        required: ["district", "state"],
      },
    },
  },
];

// Execute a tool call and return a string suitable for the tool message.
export async function runTool(name: string, argsJson: string): Promise<string> {
  let args: Record<string, string>;
  try {
    args = JSON.parse(argsJson);
  } catch {
    return JSON.stringify({ error: "Bad tool arguments (invalid JSON)" });
  }

  if (name === "get_mandi_prices") {
    const state = args.state?.trim();
    const commodity = args.commodity?.trim() || undefined;
    if (!state) return JSON.stringify({ error: "Missing state" });
    try {
      const records = await fetchMandi({ state, commodity, limit: 200 });
      if (records.length === 0) {
        return JSON.stringify({
          state,
          commodity: commodity ?? null,
          note: `No mandi records available for ${state}${commodity ? ` and ${commodity}` : ""} today in the data.gov.in feed.`,
          records: [],
        });
      }
      const best = commodity
        ? records.slice(0, 15)
        : bestMarketsByCommodity(records).slice(0, 15);
      return JSON.stringify({
        state,
        commodity: commodity ?? null,
        recordCount: records.length,
        top: best.map((r) => ({
          commodity: r.commodity,
          market: r.market,
          district: r.district,
          modalPrice: inr(r.modalPrice) + "/qtl",
          range: `${inr(r.minPrice)}–${inr(r.maxPrice)}/qtl`,
          arrivalDate: r.arrivalDate,
        })),
      });
    } catch (err) {
      return JSON.stringify({
        error: err instanceof Error ? err.message : "Mandi fetch failed",
      });
    }
  }

  if (name === "get_weather") {
    const district = args.district?.trim();
    const state = args.state?.trim();
    if (!district || !state)
      return JSON.stringify({ error: "Both district and state are required" });
    try {
      const geo = await geocode(district, state);
      if (!geo)
        return JSON.stringify({
          error: `Could not locate ${district}, ${state}. Try another district name.`,
        });
      const wx = await getWeather(geo.lat, geo.lon);
      const today = wx.daily[0];
      return JSON.stringify({
        district,
        state,
        current: {
          tempC: Math.round(wx.current.tempC),
          humidity: Math.round(wx.current.humidity),
          windKph: Math.round(wx.current.windKph),
          condition: weatherLabel(wx.current.weatherCode),
        },
        today: {
          maxTempC: Math.round(today.tempMax),
          minTempC: Math.round(today.tempMin),
          rainProbPct: Math.round(today.rainProb),
          rainMm: today.rainMm.toFixed(1),
        },
        sprayAdvice: wx.sprayAdvice,
        next5Days: wx.daily.slice(1, 6).map((d) => ({
          date: d.date,
          maxTempC: Math.round(d.tempMax),
          minTempC: Math.round(d.tempMin),
          rainProbPct: Math.round(d.rainProb),
        })),
      });
    } catch (err) {
      return JSON.stringify({
        error: err instanceof Error ? err.message : "Weather fetch failed",
      });
    }
  }

  return JSON.stringify({ error: `Unknown tool: ${name}` });
}
