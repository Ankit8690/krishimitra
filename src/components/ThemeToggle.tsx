"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTheme, type Theme } from "@/components/Theme";

const OPTIONS: { key: Theme; icon: React.ReactNode; label: string }[] = [
  { key: "system", icon: <Monitor className="w-3.5 h-3.5" />, label: "Auto" },
  { key: "light", icon: <Sun className="w-3.5 h-3.5" />, label: "Light" },
  { key: "dark", icon: <Moon className="w-3.5 h-3.5" />, label: "Dark" },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-brand-line/60 backdrop-blur"
    >
      {OPTIONS.map((o) => {
        const active = theme === o.key;
        return (
          <button
            key={o.key}
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            onClick={() => setTheme(o.key)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full transition font-semibold",
              compact ? "px-2 h-7 text-[11px]" : "px-3 h-8 text-xs",
              active
                ? "bg-brand-surface text-brand-primary shadow-sm"
                : "text-brand-mute hover:text-brand-ink"
            )}
          >
            {o.icon}
            {!compact && o.label}
          </button>
        );
      })}
    </div>
  );
}
