import type { ReactNode } from "react";

type FallbackIcon = "home" | "city" | "lock";

type EditorialFallbackProps = {
  icon?: FallbackIcon;
  /** Extra classes for the icon wrapper position (e.g. to keep it clear of a caption plate). */
  className?: string;
};

const iconPaths: Record<FallbackIcon, ReactNode> = {
  home: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 11 12 4l8 7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9.5V20h12V9.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20v-5a2 2 0 0 1 4 0v5" />
    </>
  ),
  city: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 20V9l5-3v14M10 20V4h6v16M16 20v-9h3v9" />
      <path strokeLinecap="round" d="M12.5 8h1M12.5 11h1M12.5 14h1" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path strokeLinecap="round" d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
};

/**
 * Light editorial stand-in when a bien, category or city has no real photo
 * yet: ivory/champagne ground with a discreet architectural CSS motif and a
 * gold line icon — never a dark gradient pretending to be an image.
 */
export default function EditorialFallback({ icon = "home", className = "" }: EditorialFallbackProps) {
  return (
    <div className={`editorial-pattern absolute inset-0 flex justify-center ${className || "items-center"}`} aria-hidden="true">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/50 bg-white/80 text-gold-600 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.4}>
          {iconPaths[icon]}
        </svg>
      </span>
    </div>
  );
}
