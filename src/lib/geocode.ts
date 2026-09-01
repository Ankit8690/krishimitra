import { cacheWrap } from "./cache";

export type GeoResult = { lat: number; lon: number; name?: string };

// Open-Meteo geocoding — free, no key.
export async function geocode(district: string, state: string): Promise<GeoResult | null> {
  const query = `${district}, ${state}, India`.trim();
  const key = `geo:${query.toLowerCase()}`;
  return cacheWrap(key, 60 * 60 * 24 * 30, async () => {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", query);
    url.searchParams.set("count", "5");
    url.searchParams.set("country", "IN");
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: { latitude: number; longitude: number; name: string; admin1?: string }[];
    };
    if (!data.results || data.results.length === 0) return null;
    // Prefer a match whose admin1 (state) contains the requested state
    const stateLower = state.toLowerCase();
    const preferred =
      data.results.find((r) => (r.admin1 ?? "").toLowerCase().includes(stateLower)) ??
      data.results[0];
    return { lat: preferred.latitude, lon: preferred.longitude, name: preferred.name };
  });
}
