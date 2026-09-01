"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
};

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  emptyLabel = "No match",
  disabled = false,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    // focus search on open
    setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full h-12 px-4 rounded-xl bg-white border border-brand-line text-left flex items-center justify-between",
          "focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary",
          disabled && "opacity-50 cursor-not-allowed",
          !value && "text-brand-mute"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-brand-mute shrink-0" />
      </button>

      {open && (
        <div
          className="absolute z-30 mt-1.5 w-full rounded-xl border border-brand-line bg-white shadow-lg overflow-hidden"
          role="listbox"
        >
          <div className="relative border-b border-brand-line">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-mute" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full h-11 pl-9 pr-3 text-sm bg-transparent focus:outline-none"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-brand-mute">{emptyLabel}</li>
            )}
            {filtered.map((o) => {
              const active = o === value;
              return (
                <li key={o}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o);
                      close();
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-brand-line/40",
                      active && "bg-brand-primary/10 text-brand-primary font-semibold"
                    )}
                  >
                    <span className="truncate">{o}</span>
                    {active && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
