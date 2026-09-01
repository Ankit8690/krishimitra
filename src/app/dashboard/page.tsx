"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Card, CardTitle } from "@/components/ui/Card";
import { CloudRain, TrendingUp, Sprout, Mic, MapPin } from "lucide-react";

type Me = {
  id: string;
  name: string;
  onboardingCompleted: boolean;
  location?: { district?: string; state?: string; lat?: number; lon?: number };
  farm?: { primaryCrops?: string[] };
};

export default function DashboardHome() {
  const { t } = useI18n();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          router.replace("/login");
          return;
        }
        if (!d.user.onboardingCompleted) {
          router.replace("/onboarding");
          return;
        }
        setMe(d.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
        {/* Weather card */}
        <Card className="bg-gradient-to-br from-sky-50 to-white">
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <CloudRain className="w-4 h-4" /> {t("dashboard.weather_card")}
            </span>
          </CardTitle>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold">28°</p>
              <p className="text-brand-mute text-sm">Partly cloudy · 62% RH</p>
            </div>
            <span className="rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold px-3 py-1">
              🟢 {t("dashboard.spray_ok")}
            </span>
          </div>
        </Card>

        {/* Prices card */}
        <Card>
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> {t("dashboard.prices_card")}
            </span>
          </CardTitle>
          <ul className="mt-3 divide-y divide-brand-line">
            {[
              { crop: "Wheat", mandi: "Khanna", price: "₹2,340", delta: "+₹120" },
              { crop: "Mustard", mandi: "Ludhiana", price: "₹5,620", delta: "+₹80" },
              { crop: "Potato", mandi: "Jalandhar", price: "₹1,180", delta: "-₹40" },
            ].map((r) => (
              <li key={r.crop} className="py-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{r.crop}</p>
                  <p className="text-xs text-brand-mute">{r.mandi}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{r.price}/qtl</p>
                  <p
                    className={`text-xs font-semibold ${
                      r.delta.startsWith("+") ? "text-brand-primary" : "text-brand-danger"
                    }`}
                  >
                    {r.delta}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Task card */}
        <Card className="bg-gradient-to-br from-brand-primary/5 to-white">
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <Sprout className="w-4 h-4" /> {t("dashboard.task_card")}
            </span>
          </CardTitle>
          <p className="mt-3 text-brand-ink">
            Day 45 of wheat — apply 2nd irrigation this week 💧
          </p>
        </Card>

        <p className="text-center text-xs text-brand-mute pt-2">
          Live data + ML coming in Phase 2 & 3
        </p>
      </div>

      {/* Floating mic */}
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
