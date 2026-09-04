"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "danger" | "primary";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "primary",
  icon,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  variant?: Variant;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button (safer default) + trap ESC to close
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      else if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", onKey);
    // Lock body scroll while modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-[100] grid place-items-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm bg-brand-surface rounded-2xl shadow-2xl border border-brand-line p-5 animate-in zoom-in-95 duration-150">
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-brand-mute hover:bg-brand-line/40"
          aria-label={cancelLabel}
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-11 h-11 rounded-2xl grid place-items-center shrink-0",
              variant === "danger" ? "bg-brand-danger/10 text-brand-danger" : "bg-brand-primary/10 text-brand-primary"
            )}
          >
            {icon ?? <AlertTriangle className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h2 id="confirm-title" className="font-bold text-brand-ink">
              {title}
            </h2>
            {message && (
              <p className="text-sm text-brand-mute mt-1 leading-snug">{message}</p>
            )}
          </div>
        </div>
        <div className="mt-5 flex gap-2 justify-end">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-4 h-10 rounded-xl text-sm font-semibold bg-brand-line/60 text-brand-ink hover:bg-brand-line"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "px-4 h-10 rounded-xl text-sm font-semibold text-white shadow-sm",
              variant === "danger"
                ? "bg-brand-danger hover:brightness-95"
                : "bg-brand-primary hover:bg-brand-primary-hover"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
