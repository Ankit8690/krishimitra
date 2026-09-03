"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n, type Locale } from "@/i18n/I18nProvider";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LogOut, Calendar, Check } from "lucide-react";
import { cn } from "@/lib/cn";

type Me = {
  name: string;
  email: string;
  phone?: string;
  preferredLanguage: Locale;
  location?: { district?: string; state?: string };
  farm?: {
    landSizeAcres?: number;
    soilType?: string;
    irrigation?: string;
    primaryCrops?: string[];
    sowingDates?: Record<string, string>;
  };
};

const LANGS: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
];

export default function ProfilePage() {
  const { t, setLocale } = useI18n();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savingLang, setSavingLang] = useState<Locale | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          router.replace("/login");
          return;
        }
        setMe(d.user);
        setDates(d.user.farm?.sowingDates ?? {});
      });
  }, [router]);

  async function saveSowing(crop: string, date: string) {
    if (!date) return;
    setSaving(crop);
    try {
      await fetch("/api/farm/sowing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop, sowingDate: date }),
      });
      setDates((d) => ({ ...d, [crop]: date }));
    } finally {
      setSaving(null);
    }
  }

  async function clearSowing(crop: string) {
    setSaving(crop);
    try {
      await fetch(`/api/farm/sowing?crop=${encodeURIComponent(crop)}`, {
        method: "DELETE",
      });
      setDates((d) => {
        const copy = { ...d };
        delete copy[crop];
        return copy;
      });
    } finally {
      setSaving(null);
    }
  }

  async function changeLanguage(code: Locale) {
    if (!me || me.preferredLanguage === code) return;
    setSavingLang(code);
    try {
      const r = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguage: code }),
      });
      if (r.ok) {
        setMe({ ...me, preferredLanguage: code });
        setLocale(code); // updates the whole app's UI immediately
      }
    } finally {
      setSavingLang(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (!me)
    return <div className="p-6 text-brand-mute">{t("dashboard.loading")}</div>;

  return (
    <div className="km-page-wrapper km-narrow space-y-4">
      <h1 className="text-xl font-bold">{t("profile.title")}</h1>

      <Card>
        <p className="text-brand-mute text-sm">{t("profile.name")}</p>
        <p className="font-semibold text-lg">{me.name}</p>
        <p className="text-brand-mute text-sm mt-3">{t("profile.email")}</p>
        <p>{me.email}</p>
        {me.phone && (
          <>
            <p className="text-brand-mute text-sm mt-3">{t("profile.phone")}</p>
            <p>{me.phone}</p>
          </>
        )}
      </Card>

      {me.farm && (
        <Card>
          <p className="text-brand-mute text-sm">{t("profile.farm")}</p>
          <p className="font-semibold">
            {me.farm.landSizeAcres} acres · {me.farm.soilType} soil ·{" "}
            {me.farm.irrigation}
          </p>
          {me.farm.primaryCrops && me.farm.primaryCrops.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {me.farm.primaryCrops.map((c) => (
                <span
                  key={c}
                  className="text-xs px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-medium"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Language selector — real, working, persists to server */}
      <Card>
        <CardTitle>{t("profile.language")}</CardTitle>
        <p className="text-xs text-brand-mute mt-1 mb-3">
          {t("profile.language_hint")}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {LANGS.map((l) => {
            const active = me.preferredLanguage === l.code;
            const busy = savingLang === l.code;
            return (
              <button
                key={l.code}
                onClick={() => changeLanguage(l.code)}
                disabled={busy}
                className={cn(
                  "h-12 rounded-xl text-sm border transition inline-flex items-center justify-center gap-1.5",
                  active
                    ? "bg-brand-primary text-white border-brand-primary font-semibold"
                    : "bg-white border-brand-line text-brand-ink hover:bg-brand-line/40",
                  busy && "opacity-60"
                )}
              >
                {active && <Check className="w-4 h-4" />}
                {l.label}
              </button>
            );
          })}
        </div>
      </Card>

      {me.farm?.primaryCrops && me.farm.primaryCrops.length > 0 && (
        <Card id="sowing">
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <Calendar className="w-4 h-4" /> {t("profile.sowing_dates")}
            </span>
          </CardTitle>
          <p className="text-xs text-brand-mute mt-1 mb-3">
            {t("profile.sowing_hint")}
          </p>
          <ul className="space-y-2">
            {me.farm.primaryCrops.map((crop) => (
              <li
                key={crop}
                className="flex items-center gap-2 border-b border-brand-line pb-2 last:border-b-0 last:pb-0"
              >
                <span className="flex-1 font-medium text-sm">{crop}</span>
                <Input
                  type="date"
                  value={dates[crop] ?? ""}
                  onChange={(e) => saveSowing(crop, e.target.value)}
                  className="max-w-[10rem] h-10 text-sm"
                />
                {dates[crop] && (
                  <button
                    onClick={() => clearSowing(crop)}
                    disabled={saving === crop}
                    className="text-xs text-brand-mute hover:text-brand-danger p-1"
                    aria-label={t("common.delete")}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Button variant="danger" className="w-full" onClick={logout}>
        <LogOut className="w-5 h-5" /> {t("common.logout")}
      </Button>
    </div>
  );
}
