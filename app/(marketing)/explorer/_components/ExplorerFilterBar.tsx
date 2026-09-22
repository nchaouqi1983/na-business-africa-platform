"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { defaultFilterState, type PropertyFilterState } from "@/lib/property-schema";
import { serializeFilterState } from "@/lib/public-catalog/filters";
import SearchEssentials from "./SearchEssentials";
import AdvancedFilters from "./AdvancedFilters";
import ResultsHeader from "./ResultsHeader";

type ExplorerFilterBarProps = {
  initialState: PropertyFilterState;
  cities: string[];
  districts: string[];
  resultCount: number;
  children: ReactNode;
};

/**
 * Owns the filter UI (unchanged design/components) and keeps it in sync with
 * the URL, which is what actually drives the server-side query in
 * app/explorer/page.tsx — filtering never happens client-side here, only the
 * navigation that triggers a fresh server render does. `children` is the
 * server-rendered results grid, passed straight through so it stays part of
 * the initial HTML instead of being fetched again client-side.
 */
export default function ExplorerFilterBar({ initialState, cities, districts, resultCount, children }: ExplorerFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [syncedState, setSyncedState] = useState(initialState);
  const [filters, setFilters] = useState(initialState);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // `initialState` only changes after an actual navigation to this route
  // (our own debounced replace below, the browser back/forward buttons, or
  // an external link). Resetting local state to match is a plain render-time
  // adjustment, not a side effect, so it's done during render rather than in
  // a useEffect (see https://react.dev/learn/you-might-not-need-an-effect).
  if (initialState !== syncedState) {
    setSyncedState(initialState);
    setFilters(initialState);
  }

  useEffect(() => {
    const query = serializeFilterState(filters);
    if (query === serializeFilterState(syncedState)) return;
    const timeout = setTimeout(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 350);
    return () => clearTimeout(timeout);
  }, [filters, syncedState, pathname, router]);

  function resetFilters() {
    setFilters(defaultFilterState);
    setAdvancedOpen(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <SearchEssentials
        state={filters}
        cities={cities}
        advancedOpen={advancedOpen}
        onChange={setFilters}
        onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
      />

      <div className="grid gap-10 lg:grid-cols-[300px_1fr] lg:items-start">
        <aside
          aria-label="Filtres avancés"
          className={`${advancedOpen ? "block" : "hidden"} lg:sticky lg:top-28 lg:block`}
        >
          <AdvancedFilters districts={districts} state={filters} onChange={setFilters} />
        </aside>

        <div className="flex flex-col gap-8">
          <ResultsHeader state={filters} resultCount={resultCount} onChange={setFilters} onReset={resetFilters} />
          {children}
        </div>
      </div>
    </div>
  );
}
