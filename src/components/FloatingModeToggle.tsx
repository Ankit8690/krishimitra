"use client";
import { ViewModeToggle } from "@/components/ViewModeToggle";

/**
 * Persistent, viewport-fixed toggle so users can always switch view mode
 * regardless of which dashboard page they're on. Sits below the top edge and
 * above the bottom nav.
 */
export function FloatingModeToggle() {
  return (
    <div className="km-floating-toggle fixed top-3 right-3 z-50 lg:top-4 lg:right-4 shadow-sm rounded-full bg-white/90 backdrop-blur">
      <ViewModeToggle compact />
    </div>
  );
}
