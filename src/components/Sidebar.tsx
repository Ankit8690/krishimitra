"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  ScanLine,
  Mic,
  TrendingUp,
  User as UserIcon,
  CloudRain,
  Landmark,
  Users,
  Sprout,
  FlaskConical,
  LogOut,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

type Group = {
  label: string;
  items: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }[];
};

export function Sidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setName(d.user?.name ?? ""))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  const groups: Group[] = [
    {
      label: t("nav.home"),
      items: [
        { href: "/dashboard", icon: Home, label: t("nav.home") },
      ],
    },
    {
      label: "Data",
      items: [
        { href: "/dashboard/weather", icon: CloudRain, label: t("weather.title") },
        { href: "/dashboard/prices", icon: TrendingUp, label: t("prices.title") },
        { href: "/dashboard/schemes", icon: Landmark, label: t("schemes.title") },
      ],
    },
    {
      label: "AI tools",
      items: [
        { href: "/dashboard/ask", icon: Mic, label: t("ask.title") },
        { href: "/dashboard/scan", icon: ScanLine, label: t("scan.title") },
        { href: "/dashboard/recommend", icon: Sprout, label: t("recommend.title") },
        { href: "/dashboard/fertilizer", icon: FlaskConical, label: t("fertilizer.title") },
      ],
    },
    {
      label: "You",
      items: [
        { href: "/dashboard/community", icon: Users, label: t("community.title") },
        { href: "/dashboard/profile", icon: UserIcon, label: t("profile.title") },
      ],
    },
  ];

  return (
    <aside className="km-sidebar hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-brand-surface border-r border-brand-line">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-brand-line">
        <div className="w-9 h-9 rounded-xl bg-brand-primary text-white grid place-items-center font-bold text-lg">
          🌾
        </div>
        <div className="min-w-0">
          <p className="font-bold leading-tight truncate">{t("brand")}</p>
          <p className="text-[10px] text-brand-mute leading-tight truncate">
            {t("tagline")}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="px-3 mb-1 text-[10px] uppercase tracking-wider text-brand-mute font-semibold">
              {g.label}
            </p>
            <ul className="space-y-0.5">
              {g.items.map(({ href, icon: Icon, label }) => {
                const active =
                  href === "/dashboard"
                    ? pathname === href
                    : pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
                        active
                          ? "bg-brand-primary/10 text-brand-primary font-semibold"
                          : "text-brand-ink hover:bg-brand-line/40"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", active && "stroke-[2.5]")} />
                      <span className="truncate">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Decorative slogan card */}
      <div className="mx-3 mb-3 rounded-2xl bg-gradient-to-br from-brand-primary via-emerald-600 to-emerald-700 text-white p-3 text-center relative overflow-hidden">
        <div className="text-2xl">🌾</div>
        <p className="text-[11px] font-semibold leading-snug mt-1">
          जय जवान, जय किसान
        </p>
        <p className="text-[9px] text-white/70 mt-0.5">
          Lal Bahadur Shastri
        </p>
      </div>

      <div className="p-3 border-t border-brand-line">
        {name && (
          <div className="px-3 py-2 flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-primary/15 text-brand-primary grid place-items-center font-bold text-sm shrink-0">
              {name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{name}</p>
              <button
                onClick={logout}
                className="text-[10px] text-brand-mute hover:text-brand-danger inline-flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" /> {t("common.logout")}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
