"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import CROPS from "@/data/crops.json";
import { useI18n } from "@/i18n/I18nProvider";

const CROP_NAMES = (CROPS as { name: string }[]).map((c) => c.name).sort();

type Advice = {
  crop: string;
  doses: {
    nutrient: "N" | "P" | "K";
    currentKgPerHa: number;
    targetKgPerHa: number;
    deficitKgPerHa: number;
    status: "deficient" | "adequate" | "excess";
  }[];
  products: {
    name: string;
    bagsPerAcre: number;
    bagSizeKg: number;
    note?: string;
  }[];
  organicTip: string;
};

export default function FertilizerPage() {
  const { t } = useI18n();
  const [form, setForm] = useState({
    cropName: "Wheat",
    currentN: 40,
    currentP: 20,
    currentK: 25,
  });
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ml/fertilizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed");
      else setAdvice(data.advice);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="km-page-wrapper max-w-md lg:max-w-3xl mx-auto px-5 lg:px-8 pt-4 lg:pt-6 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-brand-line/40">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <FlaskConical className="w-5 h-5 text-brand-primary" />
        <h1 className="text-xl font-bold">{t("fertilizer.title")}</h1>
      </div>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>{t("fertilizer.which_crop")}</Label>
            <Combobox
              options={CROP_NAMES}
              value={form.cropName}
              onChange={(v) => setForm({ ...form, cropName: v })}
              placeholder={t("fertilizer.choose_crop")}
            />
          </div>
          <div>
            <p className="text-xs text-brand-mute">
              {t("fertilizer.soil_hint")}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(["currentN", "currentP", "currentK"] as const).map((k, i) => (
              <div key={k}>
                <Label>{t(`fertilizer.${["n_label","p_label","k_label"][i]}`)}</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={form[k]}
                  onChange={(e) =>
                    setForm({ ...form, [k]: Number(e.target.value) || 0 })
                  }
                  className="text-center"
                />
              </div>
            ))}
          </div>
          <Button size="lg" className="w-full" disabled={loading}>
            {loading ? t("fertilizer.calculating") : t("fertilizer.submit")}
          </Button>
          {error && (
            <p className="text-sm text-brand-danger bg-brand-danger/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </form>
      </Card>

      {advice && (
        <div className="mt-5 space-y-3">
          <Card>
            <CardTitle>{t("fertilizer.status_title", { crop: advice.crop })}</CardTitle>
            <ul className="mt-3 space-y-2">
              {advice.doses.map((d) => {
                const color =
                  d.status === "adequate"
                    ? "text-brand-primary"
                    : d.status === "deficient"
                      ? "text-brand-danger"
                      : "text-brand-accent";
                return (
                  <li
                    key={d.nutrient}
                    className="grid grid-cols-[2.5rem_1fr_5rem] items-center gap-2 text-sm"
                  >
                    <span className="font-bold text-lg">{d.nutrient}</span>
                    <div>
                      <p className={cn("font-semibold", color)}>
                        {d.status === "deficient"
                          ? t("fertilizer.add_kg", { n: d.deficitKgPerHa })
                          : d.status === "excess"
                            ? t("fertilizer.excess_kg", { n: Math.abs(d.deficitKgPerHa) })
                            : t("fertilizer.adequate_msg")}
                      </p>
                      <p className="text-xs text-brand-mute">
                        {t("fertilizer.current_target", {
                          cur: d.currentKgPerHa,
                          target: Math.round(d.targetKgPerHa),
                        })}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "text-right font-semibold text-xs px-2 py-1 rounded-full",
                        color,
                        d.status === "adequate"
                          ? "bg-brand-primary/10"
                          : d.status === "deficient"
                            ? "bg-brand-danger/10"
                            : "bg-brand-accent/10"
                      )}
                    >
                      {t(`fertilizer.status.${d.status}`)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          {advice.products.length > 0 && (
            <Card>
              <CardTitle>{t("fertilizer.buy_title")}</CardTitle>
              <ul className="mt-3 space-y-2.5">
                {advice.products.map((p) => (
                  <li key={p.name} className="border-l-4 border-brand-primary pl-3">
                    <p className="font-semibold">
                      {p.bagsPerAcre}{" "}
                      {p.bagsPerAcre !== 1 ? t("fertilizer.bags") : t("fertilizer.bag")}{" "}
                      {t("fertilizer.of")} {p.name}
                    </p>
                    <p className="text-xs text-brand-mute">
                      ({t("fertilizer.bag_size", { kg: p.bagSizeKg })}) · {p.note}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="bg-brand-primary/5">
            <p className="text-sm">
              🌱 <b>{t("fertilizer.organic_tip")}:</b> {advice.organicTip}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
