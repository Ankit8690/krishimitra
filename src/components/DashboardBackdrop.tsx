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

  // Option 1 — Golden wheat at sunset. Same photo in both themes: it's
  // warm enough for light and dramatic enough for dark; we only change the
  // overlay tint below.
  const src =
    "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=2400&q=85&auto=format&fit=crop";

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
      {/* Warm/dark overlay — instead of a washed-out off-white gradient
       * that bleached the image, we use a rich amber-brown tint that
       * strengthens the sunset feel AND gives white cards on top huge
       * contrast to sit against. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            resolved === "dark"
              ? "linear-gradient(180deg, rgba(10,14,10,0.55) 0%, rgba(10,14,10,0.70) 60%, rgba(10,14,10,0.80) 100%)"
              : "linear-gradient(180deg, rgba(58,36,18,0.35) 0%, rgba(58,36,18,0.50) 60%, rgba(58,36,18,0.62) 100%)",
        }}
      />
    </div>,
    document.body
  );
}
