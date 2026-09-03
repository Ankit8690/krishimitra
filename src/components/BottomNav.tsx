"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ScanLine, Mic, TrendingUp, User } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/dashboard", icon: Home, k: "home" },
  { href: "/dashboard/scan", icon: ScanLine, k: "scan" },
  { href: "/dashboard/ask", icon: Mic, k: "ask" },
  { href: "/dashboard/prices", icon: TrendingUp, k: "prices" },
  { href: "/dashboard/profile", icon: User, k: "profile" },
] as const;

export function BottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-brand-line pb-safe">
      <ul className="max-w-md mx-auto grid grid-cols-5">
        {TABS.map(({ href, icon: Icon, k }) => {
          const active =
            href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-xs transition",
                  active ? "text-brand-primary" : "text-brand-mute"
                )}
              >
                <Icon className={cn("w-6 h-6", active && "stroke-[2.5]")} />
                <span className={cn(active && "font-semibold")}>
                  {t(`nav.${k}`)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
