import { cacheWrap } from "./cache";

// data.gov.in resource: Current Daily Price of Various Commodities from Various Markets
const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const BASE = "https://api.data.gov.in/resource";

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

export async function fetchMandi(filters: MandiFilters = {}): Promise<MandiRecord[]> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) throw new Error("DATA_GOV_IN_API_KEY is not set");

  const params = new URLSearchParams();
  params.set("api-key", apiKey);
  params.set("format", "json");
  params.set("limit", String(Math.min(filters.limit ?? 200, 1000)));
  if (filters.state) params.set("filters[state]", filters.state);
  if (filters.district) params.set("filters[district]", filters.district);
  if (filters.commodity) params.set("filters[commodity]", filters.commodity);

  const key = `mandi:${params.toString()}`;
  return cacheWrap(key, 60 * 60 * 2, async () => {
    const res = await fetch(`${BASE}/${RESOURCE_ID}?${params.toString()}`);
    if (!res.ok) throw new Error(`data.gov.in error ${res.status}`);
    const raw = (await res.json()) as { records?: RawRecord[] };
    return (raw.records ?? []).map(normalize);
  });
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
