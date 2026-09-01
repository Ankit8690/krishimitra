import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full h-12 px-4 rounded-xl bg-white border border-brand-line text-brand-ink placeholder:text-brand-mute",
        "focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary",
        className
      )}
      {...props}
    />
  );
});

export function Label({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-sm font-medium text-brand-ink mb-1.5", className)}
    >
      {children}
    </label>
  );
}
