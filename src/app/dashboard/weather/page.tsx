"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { ArrowLeft, CloudRain, Droplets, Wind } from "lucide-react";
import type { WeatherReport } from "@/lib/weather";
import { weatherEmoji, weatherLabel } from "@/lib/weather";
import { dayShort, hourShort } from "@/lib/format";
import { useI18n } from "@/i18n/I18nProvider";
import { tWeather, tSprayReason } from "@/lib/dictionaries";

export default function WeatherPage() {
  const { t, locale } = useI18n();
  const [wx, setWx] = useState<WeatherReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then((d) => (d.report ? setWx(d.report) : setError(d.error ?? "Failed")))
      .catch(() => setError("Weather service failed"));
  }, []);

  return (
    <div className="max-w-md mx-auto px-5 pt-4 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-brand-line/40">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">{t("weather.title")}</h1>
      </div>

      {!wx && !error && (
        <div className="space-y-3">
          <div className="h-32 rounded-2xl bg-brand-line/40 animate-pulse" />
          <div className="h-40 rounded-2xl bg-brand-line/40 animate-pulse" />
          <div className="h-56 rounded-2xl bg-brand-line/40 animate-pulse" />
        </div>
      )}

      {error && <Card className="text-brand-mute">{error}</Card>}

      {wx && (
        <div className="space-y-4">
          {/* Current + spray */}
          <Card className="bg-gradient-to-br from-sky-50 to-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-5xl font-bold">
                  {Math.round(wx.current.tempC)}°
                  <span className="ml-2 text-3xl">
                    {weatherEmoji(wx.current.weatherCode)}
                  </span>
                </p>
                <p className="text-brand-mute mt-1">
                  {tWeather(weatherLabel(wx.current.weatherCode), locale)}
                </p>
              </div>
              <div className="text-right space-y-1 text-sm text-brand-mute">
                <p className="inline-flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" /> {Math.round(wx.current.humidity)}%
                </p>
                <p className="inline-flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5" /> {Math.round(wx.current.windKph)} km/h
                </p>
                <p className="inline-flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5" /> {wx.current.rainMm} mm
                </p>
              </div>
            </div>

            <div
              className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
                wx.sprayAdvice.ok
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "bg-brand-danger/10 text-brand-danger"
              }`}
            >
              {wx.sprayAdvice.ok ? "🟢" : "🔴"} {tSprayReason(wx.sprayAdvice.reason, locale)}
            </div>
          </Card>

          {/* Hourly rain chart (SVG) */}
          <Card>
            <CardTitle>{t("weather.next_24h")}</CardTitle>
            <HourlyRainChart hourly={wx.hourly} />
          </Card>

          {/* 7-day forecast */}
          <Card>
            <CardTitle>{t("weather.seven_day")}</CardTitle>
            <ul className="mt-3 divide-y divide-brand-line">
              {wx.daily.map((d, i) => (
                <li
                  key={d.date}
                  className="py-2.5 grid grid-cols-[3.5rem_2rem_1fr_5rem] items-center gap-2 text-sm"
                >
                  <span className="font-semibold">
                    {i === 0 ? t("weather.today") : dayShort(d.date)}
                  </span>
                  <span className="text-xl text-center">
                    {weatherEmoji(d.weatherCode)}
                  </span>
                  <span className="text-brand-mute inline-flex items-center gap-2">
                    <span>💧 {Math.round(d.rainProb)}%</span>
                    <span>· {d.rainMm.toFixed(1)}mm</span>
                  </span>
                  <span className="text-right font-semibold">
                    {Math.round(d.tempMax)}° /{" "}
                    <span className="text-brand-mute font-normal">
                      {Math.round(d.tempMin)}°
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <p className="text-center text-xs text-brand-mute">
            {t("weather.source")}
          </p>
        </div>
      )}
    </div>
  );
}

function HourlyRainChart({ hourly }: { hourly: WeatherReport["hourly"] }) {
  const w = 320;
  const h = 120;
  const bars = hourly.slice(0, 24);
  const barW = w / bars.length - 2;

  return (
    <div className="mt-3 -mx-1 overflow-x-auto">
      <svg
        viewBox={`0 0 ${w} ${h + 24}`}
        role="img"
        aria-label="Hourly rain probability chart"
        className="w-full"
      >
        {bars.map((p, i) => {
          const bh = (p.rainProb / 100) * h;
          const x = i * (barW + 2);
          const y = h - bh;
          const fill = p.rainProb >= 40 ? "#c53030" : "#2e7d32";
          return (
            <g key={p.time}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={bh}
                rx={2}
                fill={fill}
                opacity={0.85}
              />
              {i % 4 === 0 && (
                <text
                  x={x + barW / 2}
                  y={h + 16}
                  fontSize={9}
                  textAnchor="middle"
                  fill="#6b7566"
                >
                  {hourShort(p.time)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
