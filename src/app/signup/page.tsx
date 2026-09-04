"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, MailCheck, RefreshCw } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { HeroPanel } from "@/components/HeroPanel";

type Step = "details" | "otp";

export default function SignupPage() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [code, setCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    preferredLanguage: locale,
  });

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDevOtp(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }
      setEmailSent(!!data.emailSent);
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep("otp");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
        return;
      }
      setLocale(form.preferredLanguage as "en" | "hi" | "pa");
      router.push("/onboarding");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    setDevOtp(null);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not resend");
        return;
      }
      if (data.devOtp) setDevOtp(data.devOtp);
      setEmailSent(!!data.emailSent);
      setResendCooldown(30);
      const iv = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) {
            clearInterval(iv);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } finally {
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
          {step === "details" ? (
            <Card className="w-full max-w-md">
              <h1 className="text-2xl font-bold mb-1">{t("auth.signup_title")}</h1>
              <p className="text-sm text-brand-mute mb-5 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-primary" /> We&apos;ll send a 6-digit code to verify your email
              </p>
              <form onSubmit={submitDetails} className="space-y-4">
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
                  {loading ? "Sending code…" : "Send verification code"}
                </Button>
              </form>
              <p className="text-sm text-brand-mute mt-4 text-center">
                {t("auth.have_account")}{" "}
                <Link href="/login" className="text-brand-primary font-semibold">
                  {t("auth.login_link")}
                </Link>
              </p>
            </Card>
          ) : (
            <Card className="w-full max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center shadow-md mb-3">
                <MailCheck className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Check your email</h1>
              <p className="text-sm text-brand-mute mt-1">
                We sent a 6-digit code to <b>{form.email}</b>. Enter it below to verify your account.
              </p>
              {emailSent ? null : (
                <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2">
                  Email delivery not configured on the server — check the dev banner below or the server console for your code.
                </div>
              )}
              {devOtp && (
                <div className="mt-3 rounded-lg bg-slate-900 text-white text-sm px-3 py-2 font-mono">
                  DEV OTP: <span className="font-bold text-emerald-300 text-lg tracking-widest">{devOtp}</span>
                </div>
              )}

              <form onSubmit={submitOtp} className="space-y-4 mt-5">
                <div>
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    className="text-center text-2xl tracking-[0.5em] font-bold"
                    placeholder="••••••"
                  />
                </div>
                {error && (
                  <p className="text-sm text-brand-danger bg-brand-danger/10 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <Button size="lg" className="w-full" disabled={loading || code.length !== 6}>
                  {loading ? "Verifying…" : "Verify & create account"}
                </Button>
              </form>

              <div className="mt-4 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("details");
                    setCode("");
                    setError(null);
                  }}
                  className="text-brand-mute hover:text-brand-ink"
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={resend}
                  disabled={resendCooldown > 0 || loading}
                  className="inline-flex items-center gap-1 text-brand-primary font-semibold disabled:text-brand-mute"
                >
                  <RefreshCw className="w-3 h-3" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
