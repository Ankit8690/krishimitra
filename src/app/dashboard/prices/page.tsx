"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { ArrowUpDown, TrendingUp } from "lucide-react";
import { inr, fmtShortDate } from "@/lib/format";

type Record = {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety?: string;
  arrivalDate: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
};

type SortKey = "modalPrice" | "commodity" | "market";

export default function PricesPage() {
  const [records, setRecords] = useState<Record[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commodity, setCommodity] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("modalPrice");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  useEffect(() => {
    fetch("/api/mandi")
      .then((r) => r.json())
      .then((d) => {
        if (d.records) setRecords(d.records);
        else setError(d.error ?? "Failed to load prices");
      })
      .catch(() => setError("Failed to load prices"));
  }, []);

  const commodities = useMemo(() => {
    if (!records) return [];
    return Array.from(new Set(records.map((r) => r.commodity))).sort();
  }, [records]);

  const filtered = useMemo(() => {
    if (!records) return [];
    const list = commodity ? records.filter((r) => r.commodity === commodity) : records;
    return [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * sortDir;
      return String(av).localeCompare(String(bv)) * sortDir;
    });
  }, [records, commodity, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(k);
      setSortDir(k === "modalPrice" ? -1 : 1);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-4 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-brand-primary" />
        <h1 className="text-xl font-bold">Mandi prices</h1>
      </div>

      {!records && !error && (
        <div className="space-y-2">
          <div className="h-12 rounded-xl bg-brand-line/40 animate-pulse" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-brand-line/40 animate-pulse" />
          ))}
        </div>
      )}
      {error && <Card className="text-brand-mute">{error}</Card>}

      {records && (
        <>
          <div className="mb-3">
            <Combobox
              options={["", ...commodities]}
              value={commodity}
              onChange={setCommodity}
              placeholder="All commodities"
              emptyLabel="No matching crop"
            />
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_5rem] text-xs uppercase tracking-wide text-brand-mute px-3 py-2 border-b border-brand-line bg-brand-bg">
              <button
                onClick={() => toggleSort("commodity")}
                className="text-left inline-flex items-center gap-1"
              >
                Crop <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => toggleSort("market")}
                className="text-left inline-flex items-center gap-1"
              >
                Mandi <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => toggleSort("modalPrice")}
                className="text-right inline-flex items-center justify-end gap-1"
              >
                Price <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>
            <ul className="divide-y divide-brand-line max-h-[65vh] overflow-y-auto">
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-brand-mute">
                  No records for this filter today.
                </li>
              )}
              {filtered.slice(0, 200).map((r, i) => (
                <li
                  key={`${r.commodity}-${r.market}-${r.variety}-${i}`}
                  className="grid grid-cols-[1fr_1fr_5rem] px-3 py-2.5 text-sm items-center"
                >
                  <div>
                    <p className="font-semibold">{r.commodity}</p>
                    {r.variety && (
                      <p className="text-xs text-brand-mute">{r.variety}</p>
                    )}
                  </div>
                  <div>
                    <p>{r.market}</p>
                    <p className="text-xs text-brand-mute">{r.district}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{inr(r.modalPrice)}</p>
                    <p className="text-[10px] text-brand-mute">
                      {inr(r.minPrice)}–{inr(r.maxPrice)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <p className="text-center text-xs text-brand-mute mt-3">
            {filtered.length > 200
              ? `Showing top 200 of ${filtered.length} rows · `
              : `${filtered.length} rows · `}
            {records[0] && `updated ${fmtShortDate(records[0].arrivalDate)}`}
            {" · "}source: data.gov.in / Agmarknet
          </p>
        </>
      )}
    </div>
  );
}
