"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/components/Theme";

/**
 * Full-viewport ambient backdrop for the dashboard home. Portalled to
 * document.body so it sits *outside* any parent stacking context / opaque
 * ancestor background — the dashboard layout's flex wrapper has bg-brand-bg
 * which would otherwise cover a nested -z-10 child.
 *
 * The overlay is intentionally moderate (55–85% of theme bg) so the farm
 * imagery is genuinely visible through the empty areas between cards, but
 * card colors on top stay unchanged (cards are opaque bg-brand-surface).
 */
export function DashboardBackdrop() {
  const [mounted, setMounted] = useState(false);
  const { resolved } = useTheme();

  useEffect(() => {
    setMounted(true);
    // Add a marker class so CSS can transparent-ify opaque layout wrappers
    // only while the backdrop is mounted. Reverted on unmount.
    document.documentElement.classList.add("km-has-backdrop");
    return () => {
      document.documentElement.classList.remove("km-has-backdrop");
    };
  }, []);

  if (!mounted) return null;

  const light =
    "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=2400&q=80&auto=format&fit=crop";
  const dark =
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=2400&q=80&auto=format&fit=crop";
  const src = resolved === "dark" ? dark : light;

  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: -1 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover"
        loading="eager"
        fetchPriority="high"
      />
      {/* Theme-aware wash — soft enough to let the imagery breathe */}
      <div
        className="absolute inset-0"
        style={{
          background:
            resolved === "dark"
              ? "linear-gradient(180deg, rgba(16,21,17,0.62) 0%, rgba(16,21,17,0.78) 60%, rgba(16,21,17,0.88) 100%)"
              : "linear-gradient(180deg, rgba(251,247,236,0.55) 0%, rgba(251,247,236,0.70) 60%, rgba(251,247,236,0.85) 100%)",
        }}
      />
    </div>,
    document.body
  );
}
