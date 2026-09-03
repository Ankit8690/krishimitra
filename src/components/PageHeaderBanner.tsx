"use client";

import { cn } from "@/lib/cn";

type Props = {
  title: string;
  subtitle?: string;
  imageUrl: string;
  imageAlt: string;
  icon?: React.ReactNode;
  className?: string;
};

/**
 * A wide banner with a farming photo, dark overlay, title and optional subtitle.
 * Rendered at the top of inner dashboard pages to break up flat forms/tables.
 */
export function PageHeaderBanner({
  title,
  subtitle,
  imageUrl,
  imageAlt,
  icon,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden mb-4 aspect-[16/6] lg:aspect-[16/4] shadow-md",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={imageAlt}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/90 via-brand-primary/60 to-transparent" />
      <div className="relative h-full flex items-center px-5 lg:px-8 text-white">
        {icon && (
          <div className="hidden sm:grid w-12 h-12 rounded-2xl bg-white/20 backdrop-blur place-items-center mr-4 shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-3xl font-bold leading-tight drop-shadow-sm">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm lg:text-base text-white/90 mt-1 drop-shadow-sm">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
