import { cacheGet, cacheSet } from "./cache";
import SEED from "@/data/mandi-seed.json";

// data.gov.in resource: Current Daily Price of Various Commodities from Various Markets
const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const BASE = "https://api.data.gov.in/resource";

// data.gov.in is famously slow/flaky — we cap each attempt at 8s and retry
// once. Fresh TTL 2h; a second "stale" copy is kept for 24h so if the API is
// down we can serve last-good data instead of returning an error.
const FRESH_TTL_S = 60 * 60 * 2;
const STALE_TTL_S = 60 * 60 * 24;
const FETCH_TIMEOUT_MS = 5000;

export type MandiRecord = {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety?: string;
  grade?: string;
  arrivalDate: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
};

type RawRecord = {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety?: string;
  grade?: string;
  arrival_date: string;
  min_price: string | number;
  max_price: string | number;
  modal_price: string | number;
};

function normalize(r: RawRecord): MandiRecord {
  return {
    state: r.state,
    district: r.district,
    market: r.market,
    commodity: r.commodity,
    variety: r.variety,
    grade: r.grade,
    arrivalDate: r.arrival_date,
    minPrice: Number(r.min_price),
    maxPrice: Number(r.max_price),
    modalPrice: Number(r.modal_price),
  };
}

export type MandiFilters = {
  state?: string;
  district?: string;
  commodity?: string;
  limit?: number;
};

export type MandiSource = "live" | "stale-cache" | "seed";
export type MandiResult = { records: MandiRecord[]; source: MandiSource; asOf?: string };

function seedRecords(filters: MandiFilters): MandiRecord[] {
  const all = (SEED as { records: MandiRecord[] }).records;
  const s = filters.state?.toLowerCase();
  const c = filters.commodity?.toLowerCase();
  return all
    .filter((r) => !s || r.state.toLowerCase() === s)
    .filter((r) => !c || r.commodity.toLowerCase() === c)
    .slice(0, filters.limit ?? 500);
}

async function fetchOnce(url: string, timeoutMs: number): Promise<RawRecord[]> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`data.gov.in status ${res.status}`);
    const raw = (await res.json()) as { records?: RawRecord[] };
    return raw.records ?? [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchMandiWithSource(filters: MandiFilters = {}): Promise<MandiResult> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) {
    const records = seedRecords(filters);
    return { records, source: "seed", asOf: (SEED as { asOf: string }).asOf };
  }

  const params = new URLSearchParams();
  params.set("api-key", apiKey);
  params.set("format", "json");
  params.set("limit", String(Math.min(filters.limit ?? 200, 1000)));
  if (filters.state) params.set("filters[state]", filters.state);
  if (filters.district) params.set("filters[district]", filters.district);
  if (filters.commodity) params.set("filters[commodity]", filters.commodity);

  const cacheKey = `mandi:${params.toString()}`;
  const staleKey = `mandi:stale:${params.toString()}`;
  const url = `${BASE}/${RESOURCE_ID}?${params.toString()}`;

  // 1. Serve fresh cache
  const fresh = await cacheGet<MandiRecord[]>(cacheKey);
  if (fresh) return { records: fresh, source: "live" };

  // 2. Circuit-breaker: if we marked upstream as down in the last 60s, skip
  // the fetch entirely and go straight to stale/seed. Saves the user a 5s
  // wait per navigation while the government API is down.
  const downFlag = await cacheGet<number>("mandi:upstream_down");
  if (!downFlag) {
    try {
      const raw = await fetchOnce(url, FETCH_TIMEOUT_MS);
      const records = raw.map(normalize);
      await cacheSet(cacheKey, records, FRESH_TTL_S);
      await cacheSet(staleKey, records, STALE_TTL_S);
      return { records, source: "live" };
    } catch {
      // Trip the breaker — next request skips the fetch
      await cacheSet("mandi:upstream_down", Date.now(), 60);
    }
  }

  // 3. Fallback: serve stale cache if we have one
  const stale = await cacheGet<MandiRecord[]>(staleKey);
  if (stale && stale.length > 0) {
    console.warn(`[mandi] upstream down, serving stale (${stale.length} records)`);
    return { records: stale, source: "stale-cache" };
  }

  // 4. Last resort: bundled seed. Government API can be down for hours,
  // but the app must still show something instead of an error page.
  const records = seedRecords(filters);
  console.warn(`[mandi] upstream + stale both empty, serving seed (${records.length} records)`);
  return { records, source: "seed", asOf: (SEED as { asOf: string }).asOf };
}

// Legacy simple API — most callers only need the records array
export async function fetchMandi(filters: MandiFilters = {}): Promise<MandiRecord[]> {
  const r = await fetchMandiWithSource(filters);
  return r.records;
}

// Aggregate: for each commodity, pick the market with the highest modal price.
export function bestMarketsByCommodity(records: MandiRecord[]): MandiRecord[] {
  const best = new Map<string, MandiRecord>();
  for (const r of records) {
    const cur = best.get(r.commodity);
    if (!cur || r.modalPrice > cur.modalPrice) best.set(r.commodity, r);
  }
  return Array.from(best.values()).sort((a, b) => b.modalPrice - a.modalPrice);
}

