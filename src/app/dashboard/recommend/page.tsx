"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sprout, Info, MapPin, Droplets, Mountain, Layers, Wand2, Wrench } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { inr } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/I18nProvider";
import { PageHeaderBanner } from "@/components/PageHeaderBanner";
import { HERO_IMAGES } from "@/lib/heroImages";

// Easy-mode preset knowledge — typical Indian soil profiles (kg/ha and pH)
type SoilKind = "alluvial" | "black" | "red" | "laterite" | "sandy" | "loamy";
const SOIL_PRESETS: Record<SoilKind, { n: number; p: number; k: number; ph: number; label: string; emoji: string; hint: string }> = {
  alluvial: { n: 80, p: 50, k: 45, ph: 7.0, label: "Alluvial", emoji: "🏞️", hint: "Ganga plains — fertile" },
  black:    { n: 60, p: 40, k: 60, ph: 7.5, label: "Black (regur)", emoji: "⬛", hint: "Deccan — cotton belt" },
  red:      { n: 40, p: 25, k: 30, ph: 6.0, label: "Red", emoji: "🟥", hint: "South plateau" },
  laterite: { n: 35, p: 20, k: 25, ph: 5.5, label: "Laterite", emoji: "🟫", hint: "Coastal / hilly" },
  sandy:    { n: 30, p: 15, k: 20, ph: 7.8, label: "Sandy / desert", emoji: "🏜️", hint: "Rajasthan, arid" },
  loamy:    { n: 70, p: 45, k: 40, ph: 6.5, label: "Loamy", emoji: "🌱", hint: "Mixed — best all-round" },
};

type WaterKind = "rainfed" | "some" | "full";
const WATER_PRESETS: Record<WaterKind, { rainfallMm: number; label: string; emoji: string; hint: string }> = {
  rainfed: { rainfallMm: 300,  label: "Rainfed only",     emoji: "☁️", hint: "No borewell / canal" },
  some:    { rainfallMm: 700,  label: "Some irrigation",  emoji: "💧", hint: "Borewell / tank" },
  full:    { rainfallMm: 1200, label: "Full irrigation",  emoji: "🚿", hint: "Canal / reliable pump" },
};

type TerrainKind = "plains" | "hilly" | "coastal" | "arid";
const TERRAIN_PRESETS: Record<TerrainKind, { tempAdj: number; humidityAdj: number; label: string; emoji: string }> = {
  plains:  { tempAdj: 0,  humidityAdj: 0,   label: "Plains",   emoji: "🌾" },
  hilly:   { tempAdj: -4, humidityAdj: 5,   label: "Hilly",    emoji: "⛰️" },
  coastal: { tempAdj: -1, humidityAdj: 15,  label: "Coastal",  emoji: "🌊" },
  arid:    { tempAdj: 3,  humidityAdj: -15, label: "Arid/dry", emoji: "🏜️" },
};

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
  const [mode, setMode] = useState<"easy" | "expert">("easy");
  const [form, setForm] = useState(DEFAULTS);
  const [results, setResults] = useState<Rec[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceState, setPriceState] = useState<string | null>(null);

  // Easy-mode picks
  const [soil, setSoil] = useState<SoilKind>("loamy");
  const [water, setWater] = useState<WaterKind>("some");
  const [terrain, setTerrain] = useState<TerrainKind>("plains");
  const [locState, setLocState] = useState<string | null>(null);
  const [locDistrict, setLocDistrict] = useState<string | null>(null);
  const [liveTempC, setLiveTempC] = useState<number | null>(null);
  const [liveHumidity, setLiveHumidity] = useState<number | null>(null);

  // Prefetch farmer profile + weather once for auto-fill
  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me").then((r) => r.json());
        if (me?.user?.location) {
          setLocState(me.user.location.state ?? null);
          setLocDistrict(me.user.location.district ?? null);
        }
      } catch {}
      try {
        const wx = await fetch("/api/weather").then((r) => r.json());
        if (wx?.report?.current) {
          setLiveTempC(Math.round(wx.report.current.tempC));
          setLiveHumidity(Math.round(wx.report.current.humidity));
        }
      } catch {}
    })();
  }, []);

  async function submitPayload(payload: typeof DEFAULTS) {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/ml/crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await submitPayload(form);
  }

  async function submitEasy(e: React.FormEvent) {
    e.preventDefault();
    const soilP = SOIL_PRESETS[soil];
    const waterP = WATER_PRESETS[water];
    const terrainP = TERRAIN_PRESETS[terrain];
    const baseTemp = liveTempC ?? 25;
    const baseHum = liveHumidity ?? 65;
    const payload = {
      n: soilP.n,
      p: soilP.p,
      k: soilP.k,
      ph: soilP.ph,
      rainfallMm: waterP.rainfallMm,
      temperatureC: Math.max(5, Math.min(45, baseTemp + terrainP.tempAdj)),
      humidityPct: Math.max(20, Math.min(100, baseHum + terrainP.humidityAdj)),
    };
    setForm(payload);
    await submitPayload(payload);
  }

  return (
    <div className="km-page-wrapper">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-brand-line/40">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>
      <PageHeaderBanner
        title={t("recommend.title")}
        subtitle={t("dashboard.best_crop_body")}
        imageUrl={HERO_IMAGES.recommend}
        imageAlt="Green wheat crop"
        icon={<Sprout className="w-6 h-6" />}
      />

      {/* Mode toggle */}
      <div className="mb-3 flex gap-2 p-1 bg-brand-line/40 rounded-full w-fit">
        <button
          type="button"
          onClick={() => setMode("easy")}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 transition",
            mode === "easy"
              ? "bg-white shadow text-brand-primary"
              : "text-brand-mute hover:text-brand-ink"
          )}
        >
          <Wand2 className="w-4 h-4" /> Easy mode
        </button>
        <button
          type="button"
          onClick={() => setMode("expert")}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 transition",
            mode === "expert"
              ? "bg-white shadow text-brand-primary"
              : "text-brand-mute hover:text-brand-ink"
          )}
        >
          <Wrench className="w-4 h-4" /> Expert (soil card)
        </button>
      </div>

      {mode === "easy" && (
        <Card className="bg-gradient-to-br from-emerald-50 via-white to-white border-emerald-200">
          <form onSubmit={submitEasy} className="space-y-5">
            <p className="text-xs text-brand-mute inline-flex items-center gap-1">
              <Info className="w-3 h-3" /> No soil card needed — pick what you know about your land.
            </p>

            {/* Location auto */}
            <div className="rounded-xl bg-white border border-brand-line px-3 py-2.5 flex items-center gap-2 text-sm">
              <div className="w-9 h-9 rounded-lg bg-sky-100 grid place-items-center shrink-0">
                <MapPin className="w-4 h-4 text-sky-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-brand-ink">Your location</p>
                <p className="text-xs text-brand-mute">
                  {locDistrict || locState
                    ? `${locDistrict ?? ""}${locDistrict && locState ? ", " : ""}${locState ?? ""}`
                    : "Set district in profile"}
                  {liveTempC != null && ` · ${liveTempC}°C · ${liveHumidity}% RH`}
                </p>
              </div>
              <Link href="/dashboard/profile" className="text-xs text-brand-primary font-semibold">Change</Link>
            </div>

            {/* Soil type */}
            <div>
              <Label>
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" /> Soil type
                </span>
              </Label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(SOIL_PRESETS) as SoilKind[]).map((k) => {
                  const p = SOIL_PRESETS[k];
                  const active = soil === k;
                  return (
                    <button
                      type="button"
                      key={k}
                      onClick={() => setSoil(k)}
                      className={cn(
                        "text-left rounded-xl p-3 border-2 transition",
                        active
                          ? "border-emerald-500 bg-emerald-50 shadow-md"
                          : "border-brand-line bg-white hover:border-emerald-300"
                      )}
                    >
                      <div className="text-2xl leading-none">{p.emoji}</div>
                      <p className="font-bold text-sm mt-1">{p.label}</p>
                      <p className="text-[11px] text-brand-mute leading-tight">{p.hint}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Water */}
            <div>
              <Label>
                <span className="inline-flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-sky-600" /> Water availability
                </span>
              </Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(Object.keys(WATER_PRESETS) as WaterKind[]).map((k) => {
                  const p = WATER_PRESETS[k];
                  const active = water === k;
                  return (
                    <button
                      type="button"
                      key={k}
                      onClick={() => setWater(k)}
                      className={cn(
                        "text-left rounded-xl p-3 border-2 transition",
                        active
                          ? "border-sky-500 bg-sky-50 shadow-md"
                          : "border-brand-line bg-white hover:border-sky-300"
                      )}
                    >
                      <div className="text-2xl leading-none">{p.emoji}</div>
                      <p className="font-bold text-sm mt-1">{p.label}</p>
                      <p className="text-[11px] text-brand-mute leading-tight">{p.hint}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Terrain */}
            <div>
              <Label>
                <span className="inline-flex items-center gap-1.5">
                  <Mountain className="w-4 h-4 text-amber-700" /> Terrain / geography
                </span>
              </Label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {(Object.keys(TERRAIN_PRESETS) as TerrainKind[]).map((k) => {
                  const p = TERRAIN_PRESETS[k];
                  const active = terrain === k;
                  return (
                    <button
                      type="button"
                      key={k}
                      onClick={() => setTerrain(k)}
                      className={cn(
                        "text-center rounded-xl p-2 border-2 transition",
                        active
                          ? "border-amber-500 bg-amber-50 shadow-md"
                          : "border-brand-line bg-white hover:border-amber-300"
                      )}
                    >
                      <div className="text-xl leading-none">{p.emoji}</div>
                      <p className="font-semibold text-xs mt-1">{p.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button size="lg" className="w-full" disabled={loading}>
              {loading ? t("recommend.calculating") : "Recommend crops for my land"}
            </Button>
            {error && (
              <p className="text-sm text-brand-danger bg-brand-danger/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </form>
        </Card>
      )}

      {mode === "expert" && (
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
      )}

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
