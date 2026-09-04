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
  // the mobile off-canvas drawer. Uses flex-column with flex-1 nav so the
  // list scrolls internally on any viewport size; header + footer stay pinned.
  // Mobile-drawer sizes are set to `km-drawer *` overrides in globals.css so
  // desktop sidebar keeps its comfortable spacing.
  const body = (
    <>
      <div className="km-nav-head px-4 py-4 flex items-center gap-2.5 border-b border-brand-line shrink-0">
        <div className="km-nav-logo w-10 h-10 rounded-xl bg-brand-primary text-white grid place-items-center font-bold text-xl shadow-sm">
          🌾
        </div>
        <div className="min-w-0 flex-1">
          <p className="km-nav-brand font-bold leading-tight truncate">{t("brand")}</p>
          <p className="km-nav-tagline text-[11px] text-brand-mute leading-tight truncate">{t("tagline")}</p>
        </div>
        {/* Close button — only visible in the mobile drawer */}
        <button
          onClick={() => setDrawerOpen(false)}
          className="km-drawer-close hidden w-9 h-9 rounded-full bg-brand-line/60 hover:bg-brand-line grid place-items-center"
          aria-label={t("common.close")}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="km-nav-body flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-4">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="km-nav-section px-3 mb-1 text-[10px] uppercase tracking-wider text-brand-mute font-bold">
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
                        "km-nav-item flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition min-h-[44px]",
                        active
                          ? "bg-brand-primary/12 text-brand-primary font-bold shadow-sm"
                          : "text-brand-ink hover:bg-brand-line/40 font-medium"
                      )}
                    >
                      <Icon className={cn("km-nav-icon w-5 h-5 shrink-0", active && "stroke-[2.5]")} />
                      <span className="truncate">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="km-nav-foot p-3 border-t border-brand-line shrink-0">
        {name && (
          <div className="px-2 py-2 flex items-center gap-2 min-w-0">
            <Link
              href="/dashboard/profile"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-2.5 min-w-0 flex-1 rounded-xl hover:bg-brand-line/40 p-1.5"
              aria-label={t("profile.title")}
            >
              <div className="w-9 h-9 rounded-full bg-brand-primary/15 text-brand-primary grid place-items-center font-bold shrink-0">
                {name.charAt(0)}
              </div>
              <p className="text-sm font-semibold truncate">{name}</p>
            </Link>
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-9 h-9 rounded-full text-brand-mute hover:bg-brand-danger/10 hover:text-brand-danger transition grid place-items-center"
              aria-label={t("common.logout")}
              title={t("common.logout")}
            >
              <LogOutIcon className="w-5 h-5" />
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
