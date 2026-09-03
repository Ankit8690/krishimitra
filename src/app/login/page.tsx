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

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("auth.login_error"));
        setLoading(false);
        return;
      }
      const next = data.user?.onboardingCompleted ? "/dashboard" : "/onboarding";
      router.push(next);
    } catch {
      setError(t("auth.login_error"));
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
          <h1 className="text-2xl font-bold mb-6">{t("auth.login_title")}</h1>
          <form onSubmit={submit} className="space-y-4">
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
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-brand-danger bg-brand-danger/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button size="lg" className="w-full" disabled={loading}>
              {loading ? "…" : t("auth.submit_login")}
            </Button>
          </form>
          <p className="text-sm text-brand-mute mt-4 text-center">
            {t("auth.no_account")}{" "}
            <Link href="/signup" className="text-brand-primary font-semibold">
              {t("auth.signup_link")}
            </Link>
          </p>
        </Card>
      </main>
      </div>
    </div>
  );
}
