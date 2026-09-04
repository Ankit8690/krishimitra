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
  MessageSquareHeart,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LogOut as LogOutIcon } from "lucide-react";

type Group = {
  label: string;
  items: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }[];
};

export function Sidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setName(d.user?.name ?? ""))
      .catch(() => {});
  }, []);

  // Auto-close the mobile drawer when the route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open + ESC to close
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  async function doLogout() {
    setConfirmOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  const groups: Group[] = [
    {
      label: t("nav.home"),
      items: [{ href: "/dashboard", icon: Home, label: t("nav.home") }],
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
        { href: "/dashboard/feedback", icon: MessageSquareHeart, label: "Feedback" },
        { href: "/dashboard/profile", icon: UserIcon, label: t("profile.title") },
        { href: "/dashboard/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  // Shared inner navigation body — rendered inside both the desktop aside and
  // the mobile off-canvas drawer.
  const body = (
    <>
      <div className="px-5 py-5 flex items-center gap-2 border-b border-brand-line">
        <div className="w-9 h-9 rounded-xl bg-brand-primary text-white grid place-items-center font-bold text-lg">
          🌾
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight truncate">{t("brand")}</p>
          <p className="text-[10px] text-brand-mute leading-tight truncate">{t("tagline")}</p>
        </div>
        {/* Close button — only visible in the mobile drawer */}
        <button
          onClick={() => setDrawerOpen(false)}
          className="km-drawer-close hidden p-1.5 rounded-lg hover:bg-brand-line/40"
          aria-label={t("common.close")}
        >
          <X className="w-4 h-4" />
        </button>
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
                      onClick={() => setDrawerOpen(false)}
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

      <div className="p-3 border-t border-brand-line">
        {name && (
          <div className="px-3 py-2 flex items-center gap-2 min-w-0">
            <Link
              href="/dashboard/profile"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-2 min-w-0 flex-1 rounded-lg hover:bg-brand-line/40 p-1 -m-1"
              aria-label={t("profile.title")}
            >
              <div className="w-8 h-8 rounded-full bg-brand-primary/15 text-brand-primary grid place-items-center font-bold text-sm shrink-0">
                {name.charAt(0)}
              </div>
              <p className="text-sm font-semibold truncate">{name}</p>
            </Link>
            <button
              onClick={() => setConfirmOpen(true)}
              className="p-1.5 rounded-lg text-brand-mute hover:bg-brand-danger/10 hover:text-brand-danger transition"
              aria-label={t("common.logout")}
              title={t("common.logout")}
            >
              <LogOutIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Hamburger — shown on mobile (real viewport) and force-mobile mode.
       * Fixed to top-left, well above content. Hidden on lg+ where the
       * desktop sidebar is visible. */}
      <button
        onClick={() => setDrawerOpen(true)}
        aria-label="Open menu"
        className="km-hamburger lg:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-full bg-brand-surface border border-brand-line shadow-md grid place-items-center hover:bg-brand-line/40"
      >
        <Menu className="w-5 h-5 text-brand-ink" />
      </button>

      {/* Desktop sidebar — sticky aside, unchanged */}
      <aside className="km-sidebar hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-brand-surface border-r border-brand-line">
        {body}
      </aside>

      {/* Mobile drawer — off-canvas, slides in from the left */}
      <div
        className={cn(
          "km-drawer-backdrop fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className={cn(
          "km-drawer fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-brand-surface border-r border-brand-line flex flex-col shadow-2xl lg:hidden transition-transform duration-200 ease-out",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {body}
      </aside>

      <ConfirmDialog
        open={confirmOpen}
        title={t("common.confirm_logout")}
        message={t("common.confirm_logout_body")}
        confirmLabel={t("common.yes_logout")}
        cancelLabel={t("common.no_cancel")}
        variant="danger"
        icon={<LogOutIcon className="w-5 h-5" />}
        onConfirm={doLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
