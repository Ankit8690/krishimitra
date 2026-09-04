"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Palette,
  MonitorSmartphone,
  Languages,
  MessageSquare,
  Volume2,
  Bell,
  ShieldCheck,
  Info,
  Cookie,
  Trash2,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

const READ_KEY = "km_read_mode";
const NOTIF_KEY = "km_notify_daily";

export default function SettingsPage() {
  const { t } = useI18n();
  const [readMode, setReadMode] = useState<"ask" | "always" | "never">("ask");
  const [notify, setNotify] = useState(false);
  const [version, setVersion] = useState("dev");

  useEffect(() => {
    try {
      const r = localStorage.getItem(READ_KEY) as "ask" | "always" | "never" | null;
      if (r) setReadMode(r);
      setNotify(localStorage.getItem(NOTIF_KEY) === "1");
    } catch {}
    fetch("/api/admin/me").then(r => r.json()).then(d => {
      if (d?.system?.nodeEnv) setVersion(d.system.nodeEnv);
    }).catch(() => {});
  }, []);

  function saveRead(m: "ask" | "always" | "never") {
    setReadMode(m);
    try { localStorage.setItem(READ_KEY, m); } catch {}
    // Also persist on server for chat
    fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readAloud: m }),
    }).catch(() => {});
  }

  function saveNotify(v: boolean) {
    setNotify(v);
    try { localStorage.setItem(NOTIF_KEY, v ? "1" : "0"); } catch {}
  }

  function clearCache() {
    if (!confirm("Clear locally cached preferences and reload the app?")) return;
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    location.reload();
  }

  return (
    <div className="km-page-wrapper">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-brand-line/40">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      <Card className="mb-4 bg-gradient-to-br from-slate-100 via-white to-white">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 grid place-items-center shadow-md shrink-0">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Settings</h1>
            <p className="text-sm text-brand-mute mt-1">
              Adjust appearance, view mode, language, chat behavior, and privacy — all in one place.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {/* Appearance */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 grid place-items-center">
              <Palette className="w-4 h-4" />
            </div>
            <CardTitle>Appearance</CardTitle>
          </div>
          <p className="text-xs text-brand-mute mb-3">
            Light for daylight, dark for evening reading. Auto follows your device.
          </p>
          <ThemeToggle />
        </Card>

        {/* View mode */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 grid place-items-center">
              <MonitorSmartphone className="w-4 h-4" />
            </div>
            <CardTitle>View mode</CardTitle>
          </div>
          <p className="text-xs text-brand-mute mb-3">
            Force a phone-shaped layout on your laptop, or expand the desktop view on a phone.
          </p>
          <ViewModeToggle />
        </Card>

        {/* Language */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center">
              <Languages className="w-4 h-4" />
            </div>
            <CardTitle>Language</CardTitle>
          </div>
          <p className="text-xs text-brand-mute mb-3">
            Interface language. Chat can use any of 13 Indian languages inside a conversation.
          </p>
          <LanguageSwitcher />
        </Card>

        {/* Chat preferences */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 grid place-items-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <CardTitle>Chat</CardTitle>
          </div>
          <p className="text-xs text-brand-mute mb-3 inline-flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" /> Read aloud behavior for chat replies
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(["ask", "always", "never"] as const).map((m) => (
              <button
                key={m}
                onClick={() => saveRead(m)}
                className={cn(
                  "h-11 rounded-xl text-sm font-semibold border transition capitalize",
                  readMode === m
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "bg-brand-surface border-brand-line text-brand-ink hover:bg-brand-line/40"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 grid place-items-center">
              <Bell className="w-4 h-4" />
            </div>
            <CardTitle>Notifications</CardTitle>
          </div>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="font-semibold text-brand-ink text-sm">Daily crop task reminder</p>
              <p className="text-xs text-brand-mute mt-0.5">
                Show a browser badge with today&apos;s farm task when you open the app.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notify}
              onClick={() => saveNotify(!notify)}
              className={cn(
                "relative w-11 h-6 rounded-full transition shrink-0",
                notify ? "bg-brand-primary" : "bg-brand-line"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  notify && "translate-x-5"
                )}
              />
            </button>
          </label>
        </Card>

        {/* Privacy & data */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 grid place-items-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <CardTitle>Privacy & data</CardTitle>
          </div>
          <div className="space-y-2">
            <RowLink icon={<Info className="w-4 h-4" />} label="What we collect" href="/dashboard/profile">
              Name, phone, location & farm profile you provided
            </RowLink>
            <RowLink icon={<Cookie className="w-4 h-4" />} label="Local preferences" href="#" onClick={(e) => { e.preventDefault(); clearCache(); }}>
              Theme, view mode & chat prefs saved on this device
            </RowLink>
            <button
              type="button"
              onClick={clearCache}
              className="w-full text-left inline-flex items-center gap-3 rounded-xl px-3 py-2.5 border border-brand-danger/30 hover:bg-brand-danger/5 text-brand-danger"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold">Clear local cache</p>
                <p className="text-xs text-brand-danger/70">Erases device preferences & reloads</p>
              </div>
            </button>
          </div>
        </Card>

        {/* About */}
        <Card className="bg-brand-bg/40">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-brand-line text-brand-mute grid place-items-center">
              <Info className="w-4 h-4" />
            </div>
            <CardTitle>About KrishiMitra</CardTitle>
          </div>
          <div className="text-sm text-brand-mute space-y-1">
            <p>Environment: <b className="text-brand-ink">{version}</b></p>
            <p>Weather: Open-Meteo · Prices: data.gov.in Agmarknet · Chat: Groq gpt-oss</p>
            <p>Disease scan: MobileNetV2 via HuggingFace Inference</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function RowLink({
  icon,
  label,
  children,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  children?: React.ReactNode;
  href: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-brand-line hover:bg-brand-line/40 transition"
    >
      <span className="text-brand-mute shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-brand-ink text-sm">{label}</p>
        {children && <p className="text-xs text-brand-mute mt-0.5">{children}</p>}
      </div>
    </Link>
  );
}
