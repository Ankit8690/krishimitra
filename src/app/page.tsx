"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CloudRain, TrendingUp, ScanLine, Mic } from "lucide-react";

export default function Landing() {
  const { t } = useI18n();

  const features = [
    { icon: CloudRain, k: "f1" },
    { icon: TrendingUp, k: "f2" },
    { icon: ScanLine, k: "f3" },
    { icon: Mic, k: "f4" },
  ];

  return (
    <div className="min-h-screen">
      <header className="max-w-5xl mx-auto flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-primary text-white grid place-items-center font-bold">
            🌾
          </div>
          <span className="font-semibold text-lg">{t("brand")}</span>
        </div>
        <LanguageSwitcher />
      </header>

      <section className="max-w-3xl mx-auto text-center px-5 pt-10 pb-14">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          {t("landing.hero_title")}
        </h1>
        <p className="mt-5 text-lg text-brand-mute max-w-xl mx-auto">
          {t("landing.hero_sub")}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              {t("landing.cta_start")}
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              {t("landing.cta_login")}
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 pb-16">
        <h2 className="text-center text-2xl font-semibold mb-8">
          {t("landing.features_title")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, k }) => (
            <Card key={k}>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary grid place-items-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {t(`landing.${k}_title`)}
                  </h3>
                  <p className="text-brand-mute mt-1">
                    {t(`landing.${k}_body`)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <footer className="text-center text-brand-mute text-sm py-6">
        <p>{t("tagline")} · Made for 🇮🇳 farmers</p>
      </footer>
    </div>
  );
}
