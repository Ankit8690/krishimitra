"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { ArrowUpDown, TrendingUp } from "lucide-react";
import { inr, fmtShortDate } from "@/lib/format";
import { useI18n } from "@/i18n/I18nProvider";
import { tCommodity } from "@/lib/dictionaries";

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
  const { t, locale } = useI18n();
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
    <div className="km-page-wrapper max-w-md lg:max-w-5xl mx-auto px-5 lg:px-8 pt-4 lg:pt-6 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-brand-primary" />
        <h1 className="text-xl font-bold">{t("prices.title")}</h1>
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
              placeholder={t("prices.all_commodities")}
              emptyLabel={t("prices.no_matching")}
            />
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_5rem] text-xs uppercase tracking-wide text-brand-mute px-3 py-2 border-b border-brand-line bg-brand-bg">
              <button
                onClick={() => toggleSort("commodity")}
                className="text-left inline-flex items-center gap-1"
              >
                {t("prices.crop")} <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => toggleSort("market")}
                className="text-left inline-flex items-center gap-1"
              >
                {t("prices.mandi")} <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => toggleSort("modalPrice")}
                className="text-right inline-flex items-center justify-end gap-1"
              >
                {t("prices.price")} <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>
            <ul className="divide-y divide-brand-line max-h-[65vh] overflow-y-auto">
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-brand-mute">
                  {t("prices.no_records")}
                </li>
              )}
              {filtered.slice(0, 200).map((r, i) => (
                <li
                  key={`${r.commodity}-${r.market}-${r.variety}-${i}`}
                  className="grid grid-cols-[1fr_1fr_5rem] px-3 py-2.5 text-sm items-center"
                >
                  <div>
                    <p className="font-semibold">{tCommodity(r.commodity, locale)}</p>
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
              ? `${t("prices.showing_top", { n: 200, total: filtered.length })} · `
              : `${t("prices.rows", { n: filtered.length })} · `}
            {records[0] &&
              `${t("prices.updated", { date: fmtShortDate(records[0].arrivalDate) })}`}
            {" · "}
            {t("prices.source")}
          </p>
        </>
      )}
    </div>
  );
}
