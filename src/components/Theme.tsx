"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "km_theme";

type Ctx = { theme: Theme; resolved: "light" | "dark"; setTheme: (t: Theme) => void };
const ThemeContext = createContext<Ctx | null>(null);

function applyTheme(t: Theme) {
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const resolved = t === "system" ? (media.matches ? "dark" : "light") : t;
  if (resolved === "dark") root.setAttribute("data-theme", "dark");
  else root.setAttribute("data-theme", "light");
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    let saved: Theme = "system";
    try {
      const s = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (s === "light" || s === "dark" || s === "system") saved = s;
    } catch {}
    setThemeState(saved);
    setResolved(applyTheme(saved));

    // Re-apply when system theme changes AND user is on "system"
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const cur = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
      if (cur === "system") setResolved(applyTheme("system"));
    };
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {}
    setResolved(applyTheme(t));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "system", resolved: "light", setTheme: () => {} };
  return ctx;
}
