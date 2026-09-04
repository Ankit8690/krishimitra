"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthorFooter } from "@/components/AuthorFooter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DailyQuote } from "@/components/DailyQuote";
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
  Sun,
  Droplets,
  Wheat,
} from "lucide-react";

// Free-tier Unsplash photos — direct CDN URLs, no config needed
const HERO_IMG =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80&auto=format&fit=crop";
const FARMER_IMG =
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80&auto=format&fit=crop";
const FIELD_IMG =
  "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&q=80&auto=format&fit=crop";

export default function Landing() {
  const { t } = useI18n();

  const features = [
    { icon: CloudRain, k: "f1", tint: "from-sky-100 to-white text-sky-600" },
    { icon: TrendingUp, k: "f2", tint: "from-emerald-100 to-white text-emerald-600" },
    { icon: ScanLine, k: "f3", tint: "from-amber-100 to-white text-amber-600" },
    { icon: Mic, k: "f4", tint: "from-violet-100 to-white text-violet-600" },
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

  const steps = [
    { icon: Sprout, title: "Tell us your farm", body: "Location, land size, soil, crops — 4 quick steps." },
    { icon: CloudRain, title: "Get live insights", body: "Weather, mandi prices, spray advice — refreshed daily." },
    { icon: Mic, title: "Ask & act", body: "Voice or type — get answers in Hindi, Punjabi or English." },
  ];

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-brand-bg/85 backdrop-blur border-b border-brand-line">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 lg:px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-primary text-white grid place-items-center font-bold shadow-sm">
              🌾
            </div>
            <span className="font-bold text-lg">{t("brand")}</span>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <ViewModeToggle />
            <ThemeToggle compact />
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

      {/* HERO */}
      <section className="relative km-hero-pattern overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-12 lg:pt-24 pb-16 lg:pb-28 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center relative">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-white/80 border border-brand-primary/30 text-brand-primary shadow-sm">
              <Wheat className="w-3.5 h-3.5" /> {t("landing.features_title")}
            </span>
            <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-brand-ink">
              {t("landing.hero_title")}
            </h1>
            <p className="mt-6 text-lg lg:text-xl text-brand-mute max-w-xl leading-relaxed">
              {t("landing.hero_sub")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto shadow-md">
                  {t("landing.cta_start")} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  {t("landing.cta_login")}
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-4 gap-3 max-w-lg">
              <Stat value="₹0" label="Free forever" />
              <Stat value="13" label="Languages" />
              <Stat value="500+" label="Live markets" />
              <Stat value="24×7" label="AI advisor" />
            </div>
          </div>

          {/* Hero visual: photo card + floating preview */}
          <div className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-brand-primary/25 via-brand-accent/15 to-transparent blur-3xl" />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] max-w-md mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HERO_IMG}
                alt="Indian farmer in a wheat field at golden hour"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/70 via-brand-ink/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <p className="text-xs uppercase tracking-widest text-white/80">
                  Every farmer, every field
                </p>
                <p className="text-2xl font-bold mt-1 leading-tight">
                  Powered by AI, rooted in soil.
                </p>
              </div>
            </div>

            {/* Floating live-preview mini card */}
            <div className="hidden md:block absolute -bottom-6 -left-6 lg:-left-12 w-64 rounded-2xl bg-white shadow-xl border border-brand-line p-4 rotate-[-3deg]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-brand-mute">
                    {t("dashboard.weather_card")}
                  </p>
                  <p className="text-3xl font-bold">28° <span className="text-lg">⛅</span></p>
                </div>
                <span className="text-[10px] font-semibold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-full">
                  🟢 {t("dashboard.spray_ok")}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-brand-line text-xs">
                <div className="flex items-center justify-between">
                  <span>🌾 Wheat · Khanna</span>
                  <b>₹2,340</b>
                </div>
              </div>
            </div>

            {/* Floating leaf-scan mini card */}
            <div className="hidden md:block absolute -top-4 -right-4 lg:-right-10 w-56 rounded-2xl bg-white shadow-xl border border-brand-line p-4 rotate-[4deg]">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-brand-primary text-white grid place-items-center">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-brand-mute">AI diagnosis</p>
                  <p className="text-sm font-bold">Tomato — Late Blight</p>
                </div>
              </div>
              <p className="text-[10px] text-brand-mute mt-2">
                92% confidence · treatment in Hindi
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote strip */}
      <section className="max-w-6xl mx-auto px-4 lg:px-6 -mt-4 lg:-mt-8 relative z-10">
        <DailyQuote />
      </section>

      {/* FEATURES */}
      <section className="bg-brand-surface border-y border-brand-line mt-16">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-16 lg:py-24">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-primary">
              Why farmers love it
            </p>
            <h2 className="mt-2 text-3xl lg:text-5xl font-bold tracking-tight">
              {t("landing.features_title")}
            </h2>
            <p className="mt-3 text-brand-mute lg:text-lg">
              {t("landing.hero_sub")}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, k, tint }) => (
              <div
                key={k}
                className="relative rounded-2xl bg-brand-surface border border-brand-line p-5 hover:shadow-lg hover:-translate-y-0.5 transition"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tint} grid place-items-center shadow-inner`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mt-4">
                  {t(`landing.${k}_title`)}
                </h3>
                <p className="text-brand-mute text-sm mt-1 leading-relaxed">
                  {t(`landing.${k}_body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-4 lg:px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[5/4]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FIELD_IMG}
              alt="Terraced green fields at sunrise in rural India"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/40 via-transparent to-transparent" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-primary">
              How it works
            </p>
            <h2 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight">
              From “Namaste” to your first task in 60 seconds
            </h2>
            <div className="mt-8 space-y-5">
              {steps.map(({ icon: Icon, title, body }, i) => (
                <div key={i} className="flex gap-4">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-brand-primary text-white grid place-items-center shadow-md">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-accent text-white text-[10px] font-bold grid place-items-center">
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{title}</p>
                    <p className="text-brand-mute text-sm">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES GRID */}
      <section className="bg-brand-surface border-y border-brand-line">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-16 lg:py-24">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-primary">
              8 tools · 1 app
            </p>
            <h2 className="mt-2 text-3xl lg:text-4xl font-bold">
              Everything in your pocket
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex gap-3 items-start p-5 rounded-2xl bg-brand-bg border border-brand-line hover:border-brand-primary/40 hover:shadow-md transition"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary grid place-items-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-xs text-brand-mute mt-1 leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VOICES / TESTIMONIAL-STYLE */}
      <section className="max-w-6xl mx-auto px-4 lg:px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-3 gap-6">
          <Testimonial
            quote="मौसम की भविष्यवाणी से मैं बुवाई का सही दिन चुन पाया।"
            en="The weather forecast helped me pick the right sowing day."
            author="Suresh"
            role="Wheat farmer · Punjab"
          />
          <Testimonial
            quote="AI ने पत्ती की तस्वीर से बीमारी पहचान ली।"
            en="The AI identified the disease from just a photo."
            author="Kamla Devi"
            role="Tomato grower · Rajasthan"
          />
          <Testimonial
            quote="मंडी भाव देखकर मैंने सबसे अच्छे मंडी में बेचा।"
            en="I sold at the best mandi after checking prices."
            author="Harjeet Singh"
            role="Basmati farmer · Haryana"
          />
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-emerald-700 to-emerald-800" />
        <div className="absolute inset-0 opacity-25">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={FARMER_IMG}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            aria-hidden="true"
          />
        </div>
        <div className="relative max-w-4xl mx-auto text-center px-4 lg:px-6 py-20 lg:py-28 text-white">
          <Sun className="w-10 h-10 mx-auto text-brand-accent" />
          <h2 className="mt-4 text-3xl lg:text-5xl font-bold leading-tight">
            {t("landing.hero_title")}
          </h2>
          <p className="mt-4 text-white/90 lg:text-lg max-w-2xl mx-auto">
            {t("landing.hero_sub")}
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-white text-brand-primary hover:bg-white/90 shadow-lg"
              >
                {t("landing.cta_start")} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <AuthorFooter />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-xl lg:text-2xl font-bold text-brand-ink leading-none">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-brand-mute uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}

function Testimonial({
  quote,
  en,
  author,
  role,
}: {
  quote: string;
  en: string;
  author: string;
  role: string;
}) {
  return (
    <div className="rounded-2xl bg-brand-surface border border-brand-line p-6 relative hover:shadow-lg transition">
      <Droplets className="absolute top-4 right-4 w-5 h-5 text-brand-primary/30" />
      <p className="text-lg font-semibold leading-snug">{quote}</p>
      <p className="text-sm text-brand-mute italic mt-1">&ldquo;{en}&rdquo;</p>
      <div className="mt-4 flex items-center gap-3 border-t border-brand-line pt-4">
        <div className="w-10 h-10 rounded-full bg-brand-primary/15 text-brand-primary grid place-items-center font-bold">
          {author.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-sm">{author}</p>
          <p className="text-xs text-brand-mute">{role}</p>
        </div>
      </div>
    </div>
  );
}
