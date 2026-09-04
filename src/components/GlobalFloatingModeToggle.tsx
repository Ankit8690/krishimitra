"use client";

import { usePathname } from "next/navigation";
import { FloatingModeToggle } from "@/components/FloatingModeToggle";

/**
 * Renders the view-mode toggle on every route EXCEPT:
 * - /admin — back-office surface for a fixed persona, no farmer UI chrome
 * - /  — landing page has its own inline toggle in the header, would double up
 */
export function GlobalFloatingModeToggle() {
  const pathname = usePathname() || "";
  if (pathname.startsWith("/admin")) return null;
  if (pathname === "/") return null;
  return <FloatingModeToggle />;
}
