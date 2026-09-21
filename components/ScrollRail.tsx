"use client";

import { useRef, type ReactNode } from "react";

type ScrollRailProps = {
  children: ReactNode;
  itemWidth?: number;
};

/** Rail horizontal avec défilement fluide, utilisé pour les biens et les villes. */
export default function ScrollRail({ children, itemWidth = 320 }: ScrollRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: 1 | -1) {
    railRef.current?.scrollBy({ left: direction * (itemWidth + 24), behavior: "smooth" });
  }

  return (
    <div>
      <div
        ref={railRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Précédent"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-anthracite-200 text-anthracite-700 transition-colors hover:border-gold-500 hover:text-gold-600"
        >
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M11 6H1M1 6L5.5 1.5M1 6L5.5 10.5" stroke="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Suivant"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-anthracite-200 text-anthracite-700 transition-colors hover:border-gold-500 hover:text-gold-600"
        >
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 6H11M11 6L6.5 1.5M11 6L6.5 10.5" stroke="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}
