"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sprout, TrendingUp, Info } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { inr } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/I18nProvider";

type Rec = {
  cropName: string;
  hi: string;
  pa: string;
  matchScore: number;
  fitReasons: string[];
  misfitReasons: string[];
  yieldQtlPerAcre: number;
  modalPricePerQtl: number | null;
  revenuePerAcre: number | null;
  costPerAcre: number;
  profitPerAcre: number | null;
  season: string;
  waterNeed: string;
  durationDays: number;
};

const DEFAULTS = {
  n: 60,
  p: 45,
  k: 40,
  temperatureC: 25,
  humidityPct: 65,
  ph: 6.5,
  rainfallMm: 500,
};

export default function RecommendPage() {
  const { t } = useI18n();
  const [form, setForm] = useState(DEFAULTS);
  const [results, setResults] = useState<Rec[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceState, setPriceState] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ml/crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
      } else {
        setResults(data.recommendations.slice(0, 5));
        setPriceState(data.priceStateUsed);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="km-page-wrapper max-w-md lg:max-w-4xl mx-auto px-5 lg:px-8 pt-4 lg:pt-6 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-brand-line/40">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Sprout className="w-5 h-5 text-brand-primary" />
        <h1 className="text-xl font-bold">{t("recommend.title")}</h1>
      </div>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-xs text-brand-mute inline-flex items-center gap-1">
            <Info className="w-3 h-3" /> {t("recommend.input_hint")}
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "n", labelKey: "n_kg" },
              { key: "p", labelKey: "p_kg" },
              { key: "k", labelKey: "k_kg" },
            ].map(({ key, labelKey }) => (
              <div key={key}>
                <Label>{t(`recommend.${labelKey}`)}</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={(form as Record<string, number>)[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: Number(e.target.value) || 0 })
                  }
                  className="text-center"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("recommend.temp_c")}</Label>
              <Input
                type="number"
                step={0.1}
                value={form.temperatureC}
                onChange={(e) =>
                  setForm({ ...form, temperatureC: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <Label>{t("recommend.humidity_pct")}</Label>
              <Input
                type="number"
                value={form.humidityPct}
                onChange={(e) =>
                  setForm({ ...form, humidityPct: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <Label>{t("recommend.ph")}</Label>
              <Input
                type="number"
                step={0.1}
                value={form.ph}
                onChange={(e) => setForm({ ...form, ph: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>{t("recommend.rainfall_mm")}</Label>
              <Input
                type="number"
                value={form.rainfallMm}
                onChange={(e) =>
                  setForm({ ...form, rainfallMm: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <Button size="lg" className="w-full" disabled={loading}>
            {loading ? t("recommend.calculating") : t("recommend.submit")}
          </Button>
          {error && (
            <p className="text-sm text-brand-danger bg-brand-danger/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </form>
      </Card>

      {results && (
        <div className="mt-5 space-y-3">
          <h2 className="text-lg font-semibold px-1">{t("recommend.top_picks")}</h2>
          {results.map((r, i) => (
            <ResultCard key={r.cropName} rec={r} rank={i + 1} tt={t} />
          ))}
          <p className="text-center text-xs text-brand-mute pt-1">
            {t("recommend.footer", { state: priceState || "your state" })}
          </p>
        </div>
      )}
    </div>
  );
}

function ResultCard({
  rec,
  rank,
  tt,
}: {
  rec: Rec;
  rank: number;
  tt: (k: string, v?: Record<string, string | number>) => string;
}) {
  const pct = Math.round(rec.matchScore * 100);
  const profitColor =
    rec.profitPerAcre == null
      ? "text-brand-mute"
      : rec.profitPerAcre > 0
        ? "text-brand-primary"
        : "text-brand-danger";
  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-primary text-white grid place-items-center font-bold shrink-0">
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-semibold text-lg">{rec.cropName}</p>
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                pct >= 80
                  ? "bg-brand-primary/15 text-brand-primary"
                  : pct >= 60
                    ? "bg-brand-accent/15 text-brand-accent"
                    : "bg-brand-line text-brand-mute"
              )}
            >
              {pct}% {tt("recommend.match")}
            </span>
          </div>
          <p className="text-xs text-brand-mute mt-0.5">
            {rec.hi} · {rec.season} ·{" "}
            {tt(
              `recommend.water_${rec.waterNeed as "low" | "medium" | "high"}`
            )}{" "}
            · {rec.durationDays}
            {tt("recommend.days_short")}
          </p>
        </div>
      </div>
      <div className="border-t border-brand-line grid grid-cols-3 divide-x divide-brand-line text-center text-xs">
        <div className="py-2.5 px-1">
          <p className="text-brand-mute">{tt("recommend.yield")}</p>
          <p className="font-semibold text-sm">{rec.yieldQtlPerAcre} qtl/ac</p>
        </div>
        <div className="py-2.5 px-1">
          <p className="text-brand-mute">{tt("recommend.price")}</p>
          <p className="font-semibold text-sm">
            {rec.modalPricePerQtl ? inr(rec.modalPricePerQtl) : "—"}
          </p>
        </div>
        <div className="py-2.5 px-1">
          <p className="text-brand-mute">{tt("recommend.profit_per_acre")}</p>
          <p className={cn("font-bold text-sm", profitColor)}>
            {rec.profitPerAcre != null ? inr(rec.profitPerAcre) : "—"}
          </p>
        </div>
      </div>
      {(rec.fitReasons.length > 0 || rec.misfitReasons.length > 0) && (
        <div className="border-t border-brand-line px-4 py-3 bg-brand-bg/60 space-y-1 text-xs">
          {rec.fitReasons.map((f) => (
            <p key={f} className="text-brand-primary">
              ✓ {f}
            </p>
          ))}
          {rec.misfitReasons.map((f) => (
            <p key={f} className="text-brand-danger">
              ⚠ {f}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}
