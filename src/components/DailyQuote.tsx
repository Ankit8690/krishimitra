"use client";

import { useMemo } from "react";
import QUOTES from "@/data/quotes.json";
import { useI18n } from "@/i18n/I18nProvider";
import { Quote } from "lucide-react";

/**
 * Picks one quote per calendar day per browser (stable, based on day-of-year).
 * Rotates through the pool so the same quote isn't shown twice in a row.
 */
export function DailyQuote({ variant = "card" }: { variant?: "card" | "inline" }) {
  const { locale } = useI18n();
  const q = useMemo(() => {
    const now = new Date();
    const day = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const idx = day % QUOTES.length;
    return QUOTES[idx];
  }, []);

  const text =
    locale === "hi" ? q.hi : locale === "pa" ? q.pa : q.en;

  if (variant === "inline") {
    return (
      <p className="text-sm italic text-brand-mute">
        “{text}” — <span className="font-semibold">{q.author}</span>
      </p>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary via-emerald-600 to-emerald-700 text-white p-5 lg:p-6 shadow-md">
      <Quote className="absolute -top-3 -right-3 w-24 h-24 text-white/10" />
      <p className="text-base lg:text-lg font-medium leading-relaxed relative z-10">
        “{text}”
      </p>
      <p className="mt-3 text-xs uppercase tracking-wider text-white/80 font-semibold relative z-10">
        — {q.author}
      </p>
    </div>
  );
}
