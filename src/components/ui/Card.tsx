import * as React from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  id,
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "bg-brand-surface rounded-2xl border border-brand-line shadow-sm p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("text-sm uppercase tracking-wide text-brand-mute font-semibold", className)}>
      {children}
    </h3>
  );
}
