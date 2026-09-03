"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ViewMode = "auto" | "mobile" | "desktop";
const STORAGE_KEY = "km_view_mode";

type Ctx = { mode: ViewMode; setMode: (m: ViewMode) => void };
const ViewModeContext = createContext<Ctx | null>(null);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>("auto");

  // Load saved preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
      if (saved === "mobile" || saved === "desktop" || saved === "auto") {
        setModeState(saved);
      }
    } catch {}
  }, []);

  // Reflect on <html> so pure-CSS overrides work
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("force-mobile", "force-desktop");
    if (mode === "mobile") root.classList.add("force-mobile");
    else if (mode === "desktop") root.classList.add("force-desktop");
  }, [mode]);

  const setMode = (m: ViewMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {}
  };

  return (
    <ViewModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode(): Ctx {
  const ctx = useContext(ViewModeContext);
  if (!ctx) return { mode: "auto", setMode: () => {} };
  return ctx;
}
