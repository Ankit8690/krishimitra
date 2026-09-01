"use client";

import { useI18n, type Locale } from "@/i18n/I18nProvider";

const OPTIONS: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हिं" },
  { code: "pa", label: "ਪੰ" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="inline-flex rounded-full border border-brand-line bg-white/70 backdrop-blur p-0.5 text-sm">
      {OPTIONS.map((o) => (
        <button
          key={o.code}
          type="button"
          onClick={() => setLocale(o.code)}
          className={`px-3 py-1 rounded-full transition ${
            locale === o.code
              ? "bg-brand-primary text-white font-semibold"
              : "text-brand-ink/70 hover:text-brand-ink"
          }`}
          aria-pressed={locale === o.code}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
