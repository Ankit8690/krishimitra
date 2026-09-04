"use client";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Persistent, viewport-fixed toggles so users can always switch view mode +
 * theme regardless of which page they're on. Sits below the top edge, above
 * the bottom nav.
 */
export function FloatingModeToggle() {
  return (
    <div className="km-floating-toggle fixed top-3 right-3 z-50 lg:top-4 lg:right-4 flex items-center gap-2">
      <div className="shadow-sm rounded-full bg-brand-surface/90 backdrop-blur">
        <ViewModeToggle compact />
      </div>
      <div className="shadow-sm rounded-full bg-brand-surface/90 backdrop-blur">
        <ThemeToggle compact />
      </div>
    </div>
  );
}
