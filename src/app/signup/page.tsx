"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { HeroPanel } from "@/components/HeroPanel";

export default function SignupPage() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    preferredLanguage: locale,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("auth.signup_error"));
        setLoading(false);
        return;
      }
      setLocale(form.preferredLanguage as "en" | "hi" | "pa");
      router.push("/onboarding");
    } catch {
      setError(t("auth.signup_error"));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-brand-bg">
      <HeroPanel />
      <div className="flex-1 flex flex-col min-h-screen">
      <header className="w-full flex items-center justify-between px-5 py-4">
        <Link href="/" className="font-semibold lg:hidden">
          🌾 {t("brand")}
        </Link>
        <div className="ml-auto">
          <LanguageSwitcher />
        </div>
      </header>
      <main className="flex-1 grid place-items-center px-5 py-6">
        <Card className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6">{t("auth.signup_title")}</h1>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="name">{t("auth.name")}</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                minLength={2}
              />
            </div>
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">{t("auth.phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lang">{t("auth.language")}</Label>
              <select
                id="lang"
                value={form.preferredLanguage}
                onChange={(e) =>
                  setForm({ ...form, preferredLanguage: e.target.value as "en" | "hi" | "pa" })
                }
                className="w-full h-12 px-4 rounded-xl bg-white border border-brand-line"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="pa">ਪੰਜਾਬੀ</option>
              </select>
            </div>
            {error && (
              <p className="text-sm text-brand-danger bg-brand-danger/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button size="lg" className="w-full" disabled={loading}>
              {loading ? "…" : t("auth.submit_signup")}
            </Button>
          </form>
          <p className="text-sm text-brand-mute mt-4 text-center">
            {t("auth.have_account")}{" "}
            <Link href="/login" className="text-brand-primary font-semibold">
              {t("auth.login_link")}
            </Link>
          </p>
        </Card>
      </main>
      </div>
    </div>
  );
}
