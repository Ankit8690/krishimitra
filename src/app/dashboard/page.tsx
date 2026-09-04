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
  FlaskConical,
  ScanLine,
  Users,
  Calendar,
  MessageSquareHeart,
} from "lucide-react";
import { inr } from "@/lib/format";
import type { WeatherReport } from "@/lib/weather";
import { weatherEmoji, weatherLabel } from "@/lib/weather";
import { tCommodity, tWeather } from "@/lib/dictionaries";
import { DailyQuote } from "@/components/DailyQuote";
import { commodityIcon } from "@/lib/commodityIcons";
import { DashboardBackdrop } from "@/components/DashboardBackdrop";

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

type TodayTask = {
  crop: string;
  sowingDate: string;
  daysSince: number;
  stageRange: [number, number];
  text: string;
};

export default function DashboardHome() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [wx, setWx] = useState<WeatherReport | null>(null);
  const [wxError, setWxError] = useState<string | null>(null);
  const [prices, setPrices] = useState<MandiCard[] | null>(null);
  const [pricesError, setPricesError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TodayTask[] | null>(null);
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

      fetch("/api/tasks/today")
        .then((r) => r.json())
        .then((d) => setTasks(d.tasks ?? []))
        .catch(() => setTasks([]));
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
    <div className="km-page-wrapper km-wide relative">
      <DashboardBackdrop />
      <header className="flex items-center justify-between mb-6 lg:mb-8">
        <div>
          <p className="text-sm text-brand-mute lg:hidden">{t("brand")}</p>
          <h1 className="text-xl lg:text-3xl font-bold">
            {t("dashboard.greeting", { name: me?.name?.split(" ")[0] || "" })}
          </h1>
          {me?.location?.district && (
            <p className="text-xs lg:text-sm text-brand-mute inline-flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {me.location.district}
              {me.location.state && `, ${me.location.state}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
        </div>
      </header>

      <div className="mb-4">
        <DailyQuote />
      </div>

      <div className="km-dashboard-grid grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weather card — tappable */}
        <Link href="/dashboard/weather" className="block">
          <Card className="relative overflow-hidden bg-gradient-to-br from-sky-100 via-sky-50 to-white active:scale-[0.99] transition">
            <div className="absolute top-0 right-0 text-8xl opacity-10 pointer-events-none select-none">
              ☁️
            </div>
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
                    {tWeather(weatherLabel(wx.current.weatherCode), locale)} ·{" "}
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
          <Card className="relative overflow-hidden bg-gradient-to-br from-amber-100 via-yellow-50 to-white border-amber-200 active:scale-[0.99] transition">
            <div className="absolute top-0 right-0 text-8xl opacity-10 pointer-events-none select-none">
              💰
            </div>
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
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{commodityIcon(r.commodity)}</span>
                      <div>
                        <p className="font-semibold">{tCommodity(r.commodity, locale)}</p>
                        <p className="text-xs text-brand-mute">
                          {r.market}, {r.state}
                        </p>
                      </div>
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
                {t("dashboard.no_prices")}
              </p>
            ) : pricesError ? (
              <p className="mt-3 text-sm text-brand-mute">
                {t("dashboard.prices_unavailable")}
              </p>
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
          <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-100 via-violet-50 to-white border-indigo-200 active:scale-[0.99] transition">
            <div className="absolute top-0 right-0 text-8xl opacity-15 pointer-events-none select-none">
              🏛️
            </div>
            <div className="flex items-center justify-between">
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <Landmark className="w-4 h-4" /> {t("dashboard.govt_schemes")}
                </span>
              </CardTitle>
              <ChevronRight className="w-4 h-4 text-brand-mute" />
            </div>
            <p className="mt-3 text-brand-ink">
              {t("dashboard.govt_schemes_body")}
            </p>
          </Card>
        </Link>

        {/* ML tools row */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/recommend" className="block group">
            <Card className="h-full relative overflow-hidden bg-gradient-to-br from-emerald-500/15 via-green-100 to-white border-emerald-200 active:scale-[0.98] group-hover:shadow-lg transition">
              <div className="absolute -top-3 -right-3 text-7xl opacity-15 pointer-events-none select-none rotate-12">
                🌾
              </div>
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 grid place-items-center shadow-md">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold mt-3 text-brand-ink">{t("dashboard.best_crop")}</p>
                <p className="text-xs text-brand-mute mt-0.5 line-clamp-2">
                  {t("dashboard.best_crop_body")}
                </p>
                <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  AI <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/fertilizer" className="block group">
            <Card className="h-full relative overflow-hidden bg-gradient-to-br from-amber-400/20 via-orange-100 to-white border-amber-200 active:scale-[0.98] group-hover:shadow-lg transition">
              <div className="absolute -top-3 -right-3 text-7xl opacity-15 pointer-events-none select-none rotate-12">
                🧪
              </div>
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow-md">
                  <FlaskConical className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold mt-3 text-brand-ink">{t("dashboard.fertilizer")}</p>
                <p className="text-xs text-brand-mute mt-0.5 line-clamp-2">
                  {t("dashboard.fertilizer_body")}
                </p>
                <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                  NPK <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard/scan" className="block col-span-2 group">
            <Card className="relative overflow-hidden bg-gradient-to-r from-teal-100 via-emerald-50 to-lime-50 border-teal-200 active:scale-[0.99] group-hover:shadow-lg transition">
              <div className="absolute -bottom-4 -right-2 text-7xl opacity-15 pointer-events-none select-none rotate-12">
                🍃
              </div>
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 grid place-items-center shrink-0 shadow-md">
                  <ScanLine className="w-7 h-7 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-lg leading-tight text-brand-ink">{t("dashboard.scan_leaf")}</p>
                  <p className="text-xs text-brand-mute mt-0.5 line-clamp-2">
                    {t("dashboard.scan_leaf_body")}
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-100 px-2.5 py-1 rounded-full">
                  Scan <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Card>
          </Link>
        </div>

        {/* Today's tasks — live from crop calendar */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-lime-100 via-emerald-50 to-white border-emerald-200">
          <div className="absolute -bottom-6 -right-4 text-8xl opacity-15 pointer-events-none select-none">
            🌱
          </div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 grid place-items-center shadow-md">
                    <Calendar className="w-4 h-4 text-white" />
                  </span>
                  <span className="text-base font-bold">{t("dashboard.task_card")}</span>
                </span>
              </CardTitle>
              <Link
                href="/dashboard/profile#sowing"
                className="text-xs text-white bg-brand-primary hover:bg-brand-primary-hover font-semibold px-3 py-1.5 rounded-full shadow-sm"
              >
                {t("dashboard.set_dates")}
              </Link>
            </div>
            {tasks && tasks.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {tasks.slice(0, 3).map((task) => (
                  <li
                    key={task.crop}
                    className="text-sm bg-white/70 backdrop-blur rounded-xl px-3 py-2 border border-emerald-100"
                  >
                    <p className="font-bold text-emerald-800 flex items-center gap-2">
                      <span className="text-lg">{commodityIcon(task.crop)}</span>
                      {task.crop}
                      <span className="ml-auto text-[10px] uppercase tracking-wide text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                        {t("dashboard.day_x", { n: task.daysSince })}
                      </span>
                    </p>
                    <p className="text-brand-ink mt-1 text-[13px] leading-snug">{task.text}</p>
                  </li>
                ))}
              </ul>
            ) : tasks ? (
              <p className="mt-3 text-sm text-brand-mute">
                {t("dashboard.add_sowing_hint")}
              </p>
            ) : (
              <div className="mt-3 h-14 rounded-lg bg-brand-line/40 animate-pulse" />
            )}
          </div>
        </Card>

        {/* Feedback shortcut */}
        <Link href="/dashboard/feedback" className="block group">
          <Card className="relative overflow-hidden bg-gradient-to-br from-pink-100 via-rose-50 to-white border-pink-200 active:scale-[0.99] group-hover:shadow-lg transition">
            <div className="absolute -top-3 -right-3 text-7xl opacity-15 pointer-events-none select-none rotate-12">
              💬
            </div>
            <div className="relative flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 grid place-items-center shrink-0 shadow-md">
                <MessageSquareHeart className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-brand-ink">Share feedback</p>
                  <ChevronRight className="w-4 h-4 text-brand-mute shrink-0" />
                </div>
                <p className="text-xs text-brand-mute mt-0.5 line-clamp-2">
                  Tell us what to improve — bugs, ideas, or praise.
                </p>
                <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-pink-700 bg-pink-100 px-2.5 py-0.5 rounded-full">
                  ★ Rate us <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Card>
        </Link>

        {/* Community shortcut */}
        <Link href="/dashboard/community" className="block group">
          <Card className="relative overflow-hidden bg-gradient-to-br from-orange-100 via-rose-50 to-white border-orange-200 active:scale-[0.99] group-hover:shadow-lg transition">
            <div className="absolute -top-3 -right-3 text-7xl opacity-15 pointer-events-none select-none rotate-12">
              🤝
            </div>
            <div className="relative flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 grid place-items-center shrink-0 shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-brand-ink">{t("dashboard.community_card")}</p>
                  <ChevronRight className="w-4 h-4 text-brand-mute shrink-0" />
                </div>
                <p className="text-xs text-brand-mute mt-0.5 line-clamp-2">
                  {t("dashboard.community_body")}
                </p>
                <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full">
                  Open board <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Card>
        </Link>
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
