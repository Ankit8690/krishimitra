"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Combobox } from "@/components/ui/Combobox";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { MapPin } from "lucide-react";
import DISTRICTS from "@/data/india-districts.json";

const STATES = Object.keys(DISTRICTS as Record<string, string[]>).sort();

const SOILS = ["black", "red", "sandy", "loamy", "clay", "alluvial", "unknown"] as const;
const IRRIG = ["borewell", "canal", "rainfed", "drip", "sprinkler", "unknown"] as const;
const CROPS = [
  "Wheat", "Rice", "Maize", "Cotton", "Sugarcane", "Potato", "Tomato", "Onion",
  "Mustard", "Soybean", "Groundnut", "Chickpea", "Millet", "Pulses",
];

type Data = {
  location: { lat?: number; lon?: number; district?: string; state?: string };
  farm: {
    landSizeAcres: number;
    soilType: (typeof SOILS)[number];
    irrigation: (typeof IRRIG)[number];
    primaryCrops: string[];
  };
};

export default function OnboardingPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Data>({
    location: {},
    farm: {
      landSizeAcres: 1,
      soilType: "unknown",
      irrigation: "unknown",
      primaryCrops: [],
    },
  });

  function useGPS() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setData((d) => ({
          ...d,
          location: {
            ...d.location,
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          },
        })),
      () => {}
    );
  }

  async function finish() {
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) router.push("/dashboard");
      else setSaving(false);
    } catch {
      setSaving(false);
    }
  }

  const toggleCrop = (c: string) =>
    setData((d) => ({
      ...d,
      farm: {
        ...d.farm,
        primaryCrops: d.farm.primaryCrops.includes(c)
          ? d.farm.primaryCrops.filter((x) => x !== c)
          : [...d.farm.primaryCrops, c],
      },
    }));

  return (
    <div className="min-h-screen flex flex-col">
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between px-5 py-4">
        <span className="font-semibold">🌾</span>
        <LanguageSwitcher />
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-5 pb-10">
        <p className="text-sm text-brand-mute mb-2">
          {t("onboarding.step", { n: step })}
        </p>
        <div className="h-2 rounded-full bg-brand-line overflow-hidden mb-6">
          <div
            className="h-full bg-brand-primary transition-all"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
        <h1 className="text-2xl font-bold mb-6">{t("onboarding.title")}</h1>

        <Card>
          {step === 1 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">
                {t("onboarding.location_title")}
              </h2>
              <Button variant="secondary" onClick={useGPS} className="w-full">
                <MapPin className="w-5 h-5" /> {t("onboarding.use_gps")}
              </Button>
              <div>
                <Label>{t("onboarding.state")}</Label>
                <Combobox
                  options={STATES}
                  value={data.location.state || ""}
                  onChange={(v) =>
                    setData({
                      ...data,
                      location: { ...data.location, state: v, district: "" },
                    })
                  }
                  placeholder={t("onboarding.state")}
                />
              </div>
              <div>
                <Label>{t("onboarding.district")}</Label>
                <Combobox
                  options={
                    data.location.state
                      ? ((DISTRICTS as Record<string, string[]>)[data.location.state] ?? [])
                      : []
                  }
                  value={data.location.district || ""}
                  onChange={(v) =>
                    setData({
                      ...data,
                      location: { ...data.location, district: v },
                    })
                  }
                  placeholder={
                    data.location.state
                      ? t("onboarding.district")
                      : t("onboarding.state")
                  }
                  disabled={!data.location.state}
                />
              </div>
              {data.location.lat && (
                <p className="text-xs text-brand-mute">
                  📍 {data.location.lat.toFixed(3)}, {data.location.lon?.toFixed(3)}
                </p>
              )}
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">
                {t("onboarding.farm_title")}
              </h2>
              <div>
                <Label>{t("onboarding.land")}</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    inputMode="decimal"
                    value={data.farm.landSizeAcres}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const n = raw === "" ? 0 : Number(raw);
                      if (Number.isFinite(n) && n >= 0 && n <= 10000) {
                        setData({
                          ...data,
                          farm: { ...data.farm, landSizeAcres: n },
                        });
                      }
                    }}
                    className="max-w-[8rem] text-right font-semibold"
                  />
                  <span className="text-sm text-brand-mute">{t("onboarding.land_unit")}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={50}
                  step={0.1}
                  value={Math.min(50, data.farm.landSizeAcres || 0)}
                  onChange={(e) =>
                    setData({
                      ...data,
                      farm: { ...data.farm, landSizeAcres: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-brand-primary mt-2"
                />
                <p className="text-xs text-brand-mute mt-1">
                  {t("onboarding.land_hint")}
                </p>
              </div>
              <div>
                <Label>{t("onboarding.irrigation_title")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {IRRIG.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setData({ ...data, farm: { ...data.farm, irrigation: i } })
                      }
                      className={cn(
                        "h-12 rounded-xl border text-sm transition",
                        data.farm.irrigation === i
                          ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-semibold"
                          : "border-brand-line bg-white text-brand-ink"
                      )}
                    >
                      {t(`irrigation.${i}`)}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">
                {t("onboarding.soil_title")}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {SOILS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setData({ ...data, farm: { ...data.farm, soilType: s } })
                    }
                    className={cn(
                      "h-16 rounded-xl border text-sm transition",
                      data.farm.soilType === s
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-semibold"
                        : "border-brand-line bg-white text-brand-ink"
                    )}
                  >
                    {t(`soil.${s}`)}
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">
                {t("onboarding.crops_title")}
              </h2>
              <p className="text-sm text-brand-mute">{t("onboarding.crops_hint")}</p>
              <div className="flex flex-wrap gap-2">
                {CROPS.map((c) => {
                  const on = data.farm.primaryCrops.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCrop(c)}
                      className={cn(
                        "px-4 h-10 rounded-full border text-sm transition",
                        on
                          ? "border-brand-primary bg-brand-primary text-white"
                          : "border-brand-line bg-white text-brand-ink"
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </Card>

        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setStep(step - 1)}
            >
              {t("onboarding.back")}
            </Button>
          )}
          {step < 4 ? (
            <Button className="flex-1" onClick={() => setStep(step + 1)}>
              {t("onboarding.next")}
            </Button>
          ) : (
            <Button className="flex-1" onClick={finish} disabled={saving}>
              {saving ? "…" : t("onboarding.finish")}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
