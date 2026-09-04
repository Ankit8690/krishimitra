"use client";

import { usePathname } from "next/navigation";
import { FloatingModeToggle } from "@/components/FloatingModeToggle";

/**
 * Renders the view-mode toggle on every route EXCEPT /admin (admin is a
 * back-office surface for a fixed persona and shouldn't get farmer UI chrome).
 */
export function GlobalFloatingModeToggle() {
  const pathname = usePathname() || "";
  if (pathname.startsWith("/admin")) return null;
  return <FloatingModeToggle />;
}
