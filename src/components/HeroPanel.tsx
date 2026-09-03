"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import SLOGANS from "@/data/slogans.json";

const HERO_IMG =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80&auto=format&fit=crop";

/**
 * Left-side hero visual used on auth/signup pages. Big farm photo + rotating slogan
 * + brand mark. Hidden on small screens (form takes full width there).
 */
export function HeroPanel() {
  const { t, locale } = useI18n();

  const slogan = useMemo(() => {
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const s = SLOGANS[day % SLOGANS.length];
    return locale === "hi" ? s.hi : locale === "pa" ? s.pa : s.en;
  }, [locale]);

  return (
    <div className="hidden lg:flex relative w-1/2 min-h-screen overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_IMG}
        alt="Indian farmer in a wheat field"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/85 via-emerald-700/80 to-brand-ink/70" />
      <div className="relative z-10 flex flex-col justify-between p-10 text-white w-full">
        <div className="flex items-center gap-2">
          <div className="w-11 h-11 rounded-2xl bg-white/95 text-brand-primary grid place-items-center text-2xl font-bold shadow-lg">
            🌾
          </div>
          <div>
            <p className="font-bold text-xl leading-tight">{t("brand")}</p>
            <p className="text-xs text-white/80">{t("tagline")}</p>
          </div>
        </div>
        <div>
          <p className="text-4xl xl:text-5xl font-bold leading-tight max-w-md">
            {t("landing.hero_title")}
          </p>
          <div className="mt-6 pt-6 border-t border-white/20 max-w-md">
            <p className="text-lg italic leading-relaxed">“{slogan}”</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-md text-xs">
          <MiniStat value="₹0" label="Free" />
          <MiniStat value="13" label="Languages" />
          <MiniStat value="24×7" label="AI" />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center bg-white/10 backdrop-blur rounded-xl py-3 border border-white/20">
      <p className="text-xl font-bold leading-none">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-white/80 mt-1">{label}</p>
    </div>
  );
}
