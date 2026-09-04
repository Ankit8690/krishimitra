"use client";

import { useTheme } from "@/components/Theme";

/**
 * Fixed-position full-viewport background used only on the dashboard home.
 * Sits at z-index -10 behind everything else, with a strong theme-matched
 * overlay so the image reads as ambient atmosphere and cards on top keep
 * their own contrast. The image itself is high-res but capped so mobile
 * bandwidth stays reasonable.
 */
export function DashboardBackdrop() {
  const { resolved } = useTheme();
  // Two carefully picked Unsplash photos — a real wheat harvest at golden
  // hour for light mode, an evening tractor-in-field for dark. Both are
  // long-lived stable URLs with the ?w=2400 CDN size.
  const light =
    "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=2400&q=80&auto=format&fit=crop";
  const dark =
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=2400&q=80&auto=format&fit=crop";
  const src = resolved === "dark" ? dark : light;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover"
        loading="eager"
        fetchPriority="high"
      />
      {/* Theme-aware wash so cards on top stay readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            resolved === "dark"
              ? "linear-gradient(180deg, rgba(16, 21, 17, 0.88) 0%, rgba(16, 21, 17, 0.94) 60%, rgba(16, 21, 17, 0.97) 100%)"
              : "linear-gradient(180deg, rgba(251, 247, 236, 0.82) 0%, rgba(251, 247, 236, 0.90) 60%, rgba(251, 247, 236, 0.96) 100%)",
        }}
      />
    </div>
  );
}
