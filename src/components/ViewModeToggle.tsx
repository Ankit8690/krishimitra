"use client";

import { Monitor, Smartphone, MonitorSmartphone } from "lucide-react";
import { useViewMode, type ViewMode } from "@/components/ViewMode";
import { cn } from "@/lib/cn";

export function ViewModeToggle({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useViewMode();
  const options: { key: ViewMode; icon: React.ReactNode; label: string }[] = [
    { key: "auto", icon: <MonitorSmartphone className="w-4 h-4" />, label: "Auto" },
    { key: "desktop", icon: <Monitor className="w-4 h-4" />, label: "Web" },
    { key: "mobile", icon: <Smartphone className="w-4 h-4" />, label: "Mobile" },
  ];

  return (
    <div className="inline-flex items-center rounded-full border border-brand-line bg-white/70 backdrop-blur p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => setMode(o.key)}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition",
            mode === o.key
              ? "bg-brand-primary text-white font-semibold"
              : "text-brand-mute hover:text-brand-ink"
          )}
          aria-pressed={mode === o.key}
          title={`View mode: ${o.label}`}
        >
          {o.icon}
          {!compact && <span>{o.label}</span>}
        </button>
      ))}
    </div>
  );
}
