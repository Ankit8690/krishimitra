"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Card, CardTitle } from "@/components/ui/Card";
import {
  CloudRain,
  TrendingUp,
  Sprout,
  Mic,
  MapPin,
  ChevronRight,
  Landmark,
} from "lucide-react";
import { inr } from "@/lib/format";
import type { WeatherReport } from "@/lib/weather";
import { weatherEmoji, weatherLabel } from "@/lib/weather";

type Me = {
  id: string;
  name: string;
  onboardingCompleted: boolean;
  location?: { district?: string; state?: string; lat?: number; lon?: number };
  farm?: { primaryCrops?: string[] };
};

type MandiCard = {
  commodity: string;
  market: string;
  state: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
};

export default function DashboardHome() {
  const { t } = useI18n();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [wx, setWx] = useState<WeatherReport | null>(null);
  const [wxError, setWxError] = useState<string | null>(null);
  const [prices, setPrices] = useState<MandiCard[] | null>(null);
  const [pricesError, setPricesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (!meData.user) {
        router.replace("/login");
        return;
      }
      if (!meData.user.onboardingCompleted) {
        router.replace("/onboarding");
        return;
      }
      setMe(meData.user);
      setLoading(false);

      // Fire in parallel — page can show partial data if one fails
      fetch("/api/weather")
        .then((r) => r.json())
        .then((d) => (d.report ? setWx(d.report) : setWxError(d.error ?? "Weather unavailable")))
        .catch(() => setWxError("Weather unavailable"));

      fetch("/api/mandi?mode=best")
        .then((r) => r.json())
        .then((d) => {
          if (d.records) setPrices(d.records);
          else setPricesError(d.error ?? "Prices unavailable");
        })
        .catch(() => setPricesError("Prices unavailable"));
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-brand-mute">
        {t("dashboard.loading")}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-4">
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-brand-mute">{t("brand")}</p>
          <h1 className="text-xl font-bold">
            {t("dashboard.greeting", { name: me?.name?.split(" ")[0] || "" })}
          </h1>
          {me?.location?.district && (
            <p className="text-xs text-brand-mute inline-flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {me.location.district}
              {me.location.state && `, ${me.location.state}`}
            </p>
          )}
        </div>
        <LanguageSwitcher />
      </header>

      <div className="space-y-4">
        {/* Weather card — tappable */}
        <Link href="/dashboard/weather" className="block">
          <Card className="bg-gradient-to-br from-sky-50 to-white active:scale-[0.99] transition">
            <div className="flex items-center justify-between">
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <CloudRain className="w-4 h-4" /> {t("dashboard.weather_card")}
                </span>
              </CardTitle>
              <ChevronRight className="w-4 h-4 text-brand-mute" />
            </div>
            {wx ? (
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold">
                    {Math.round(wx.current.tempC)}°
                    <span className="ml-2 text-2xl">
                      {weatherEmoji(wx.current.weatherCode)}
                    </span>
                  </p>
                  <p className="text-brand-mute text-sm">
                    {weatherLabel(wx.current.weatherCode)} ·{" "}
                    {Math.round(wx.current.humidity)}% RH
                  </p>
                </div>
                <span
                  className={`rounded-full text-sm font-semibold px-3 py-1 whitespace-nowrap ${
                    wx.sprayAdvice.ok
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "bg-brand-danger/10 text-brand-danger"
                  }`}
                >
                  {wx.sprayAdvice.ok ? "🟢" : "🔴"}{" "}
                  {wx.sprayAdvice.ok
                    ? t("dashboard.spray_ok")
                    : t("dashboard.spray_no")}
                </span>
              </div>
            ) : wxError ? (
              <p className="mt-3 text-sm text-brand-mute">{wxError}</p>
            ) : (
              <div className="mt-3 h-14 rounded-lg bg-brand-line/40 animate-pulse" />
            )}
          </Card>
        </Link>

        {/* Prices card — tappable */}
        <Link href="/dashboard/prices" className="block">
          <Card className="active:scale-[0.99] transition">
            <div className="flex items-center justify-between">
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> {t("dashboard.prices_card")}
                </span>
              </CardTitle>
              <ChevronRight className="w-4 h-4 text-brand-mute" />
            </div>
            {prices && prices.length > 0 ? (
              <ul className="mt-3 divide-y divide-brand-line">
                {prices.slice(0, 3).map((r) => (
                  <li
                    key={r.commodity + r.market}
                    className="py-2 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold">{r.commodity}</p>
                      <p className="text-xs text-brand-mute">
                        {r.market}, {r.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{inr(r.modalPrice)}/qtl</p>
                      <p className="text-xs text-brand-mute">
                        {inr(r.minPrice)}–{inr(r.maxPrice)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : prices ? (
              <p className="mt-3 text-sm text-brand-mute">
                No price data for your crops today. Try adding more crops in profile.
              </p>
            ) : pricesError ? (
              <p className="mt-3 text-sm text-brand-mute">{pricesError}</p>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="h-8 rounded bg-brand-line/40 animate-pulse" />
                <div className="h-8 rounded bg-brand-line/40 animate-pulse" />
                <div className="h-8 rounded bg-brand-line/40 animate-pulse" />
              </div>
            )}
          </Card>
        </Link>

        {/* Schemes card — tappable */}
        <Link href="/dashboard/schemes" className="block">
          <Card className="bg-gradient-to-br from-brand-accent/10 to-white active:scale-[0.99] transition">
            <div className="flex items-center justify-between">
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <Landmark className="w-4 h-4" /> Govt schemes for you
                </span>
              </CardTitle>
              <ChevronRight className="w-4 h-4 text-brand-mute" />
            </div>
            <p className="mt-3 text-brand-ink">
              Personalized list of schemes you can apply to today.
            </p>
          </Card>
        </Link>

        {/* Task card (placeholder for Phase 5) */}
        <Card className="bg-gradient-to-br from-brand-primary/5 to-white">
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <Sprout className="w-4 h-4" /> {t("dashboard.task_card")}
            </span>
          </CardTitle>
          <p className="mt-3 text-brand-ink">
            Personalized daily tasks arrive with your crop calendar in Phase 5 🌱
          </p>
        </Card>
      </div>

      <Link
        href="/dashboard/ask"
        aria-label={t("nav.ask")}
        className="fixed bottom-24 right-5 z-20 w-14 h-14 rounded-full bg-brand-primary text-white grid place-items-center shadow-lg hover:bg-brand-primary-hover"
      >
        <Mic className="w-6 h-6" />
      </Link>
    </div>
  );
}
