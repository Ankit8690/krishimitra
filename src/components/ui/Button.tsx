import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-brand-primary text-white hover:bg-brand-primary-hover shadow-sm",
  secondary:
    "bg-white text-brand-ink border border-brand-line hover:bg-brand-line/40",
  ghost: "bg-transparent text-brand-ink hover:bg-brand-line/50",
  danger: "bg-brand-danger text-white hover:opacity-90",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-5 text-base rounded-xl",
  lg: "h-14 px-6 text-lg rounded-2xl font-semibold",
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40",
        VARIANT[variant],
        SIZE[size],
        className
      )}
      {...props}
    />
  );
});
