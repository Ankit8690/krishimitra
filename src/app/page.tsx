"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  CloudRain,
  TrendingUp,
  ScanLine,
  Mic,
  Landmark,
  Sprout,
  Users,
  FlaskConical,
  ArrowRight,
} from "lucide-react";

export default function Landing() {
  const { t } = useI18n();

  const features = [
    { icon: CloudRain, k: "f1" },
    { icon: TrendingUp, k: "f2" },
    { icon: ScanLine, k: "f3" },
    { icon: Mic, k: "f4" },
  ];

  const capabilities = [
    { icon: CloudRain, title: t("weather.title"), body: t("landing.f1_body") },
    { icon: TrendingUp, title: t("prices.title"), body: t("landing.f2_body") },
    { icon: ScanLine, title: t("scan.title"), body: t("landing.f3_body") },
    { icon: Mic, title: t("ask.title"), body: t("landing.f4_body") },
    { icon: Sprout, title: t("dashboard.best_crop"), body: t("dashboard.best_crop_body") },
    { icon: FlaskConical, title: t("dashboard.fertilizer"), body: t("dashboard.fertilizer_body") },
    { icon: Landmark, title: t("schemes.title"), body: t("dashboard.govt_schemes_body") },
    { icon: Users, title: t("community.title"), body: t("dashboard.community_body") },
  ];

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Nav */}
      <header className="sticky top-0 z-20 bg-brand-bg/85 backdrop-blur border-b border-brand-line">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 lg:px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-primary text-white grid place-items-center font-bold">
              🌾
            </div>
            <span className="font-bold text-lg">{t("brand")}</span>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <ViewModeToggle />
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="secondary" size="sm">
                {t("auth.submit_login")}
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">{t("landing.cta_start")}</Button>
            </Link>
          </div>
          <div className="md:hidden">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 lg:px-6 pt-12 lg:pt-20 pb-14 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary">
              🇮🇳 {t("landing.features_title")}
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-brand-ink">
              {t("landing.hero_title")}
            </h1>
            <p className="mt-5 text-lg lg:text-xl text-brand-mute max-w-xl">
              {t("landing.hero_sub")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  {t("landing.cta_start")} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  {t("landing.cta_login")}
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-xs text-brand-mute">
              <Stat label="Free forever" value="₹0" />
              <Stat label="Indian languages" value="13" />
              <Stat label="Live gov data" value="✓" />
              <Stat label="Works offline" value="✓" />
            </div>
          </div>

          {/* Right visual */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-brand-primary/20 via-brand-accent/10 to-transparent blur-2xl" />
            <div className="relative rounded-3xl bg-brand-surface border border-brand-line shadow-xl p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-brand-mute uppercase tracking-wide">
                    {t("dashboard.weather_card")}
                  </p>
                  <p className="text-5xl font-bold mt-1">
                    28°<span className="text-2xl ml-2">⛅</span>
                  </p>
                </div>
                <span className="rounded-full bg-brand-primary/15 text-brand-primary text-xs font-semibold px-3 py-1.5">
                  🟢 {t("dashboard.spray_ok")}
                </span>
              </div>
              <div className="border-t border-brand-line pt-4 mt-4">
                <p className="text-xs text-brand-mute uppercase tracking-wide mb-2">
                  {t("dashboard.prices_card")}
                </p>
                <ul className="space-y-2 text-sm">
                  {[
                    { c: "Wheat", m: "Khanna", p: "₹2,340" },
                    { c: "Mustard", m: "Ludhiana", p: "₹5,620" },
                    { c: "Potato", m: "Jalandhar", p: "₹1,180" },
                  ].map((r) => (
                    <li key={r.c} className="flex items-center justify-between">
                      <span>
                        <b>{r.c}</b>
                        <span className="text-brand-mute text-xs ml-2">{r.m}</span>
                      </span>
                      <b>{r.p}/qtl</b>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-brand-line pt-4 mt-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-primary text-white grid place-items-center shrink-0">
                  <Mic className="w-4 h-4" />
                </div>
                <p className="text-sm text-brand-ink italic">
                  &ldquo;{t("ask.empty_hint")}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="bg-brand-surface border-y border-brand-line">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-14 lg:py-20">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-3xl lg:text-4xl font-bold">
              {t("landing.features_title")}
            </h2>
            <p className="mt-3 text-brand-mute">{t("landing.hero_sub")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, k }) => (
              <Card key={k} className="h-full">
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary grid place-items-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mt-4">
                  {t(`landing.${k}_title`)}
                </h3>
                <p className="text-brand-mute text-sm mt-1">
                  {t(`landing.${k}_body`)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Full capabilities */}
      <section className="max-w-6xl mx-auto px-4 lg:px-6 py-14 lg:py-20">
        <h2 className="text-center text-2xl lg:text-3xl font-bold mb-10">
          Everything you get, in one app
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {capabilities.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex gap-3 items-start p-4 rounded-2xl bg-brand-surface border border-brand-line"
            >
              <Icon className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-xs text-brand-mute mt-1">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="bg-brand-primary text-white">
        <div className="max-w-4xl mx-auto text-center px-4 lg:px-6 py-14 lg:py-20">
          <h2 className="text-2xl lg:text-4xl font-bold">
            {t("landing.hero_title")}
          </h2>
          <p className="mt-3 text-white/85">{t("landing.hero_sub")}</p>
          <div className="mt-8">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-white text-brand-primary hover:bg-white/90"
              >
                {t("landing.cta_start")} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="text-center text-brand-mute text-sm py-8">
        <p>
          {t("tagline")} · {t("landing.footer")}
        </p>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-bold text-brand-ink leading-none">{value}</p>
      <p className="mt-1">{label}</p>
    </div>
  );
}
