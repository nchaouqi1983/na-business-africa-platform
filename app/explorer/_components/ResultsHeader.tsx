"use client";

import { sortOptions, type PropertyFilterState, type SortOption } from "@/lib/property-schema";

type ResultsHeaderProps = {
  state: PropertyFilterState;
  resultCount: number;
  onChange: (next: PropertyFilterState) => void;
  onReset: () => void;
};

export default function ResultsHeader({ state, resultCount, onChange, onReset }: ResultsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-anthracite-100 pb-5">
      <p className="font-display text-lg italic text-anthracite-600">
        {resultCount} bien{resultCount > 1 ? "s" : ""} disponible{resultCount > 1 ? "s" : ""}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-anthracite-500">
          <span className="font-semibold uppercase tracking-wider">Trier</span>
          <select
            value={state.sort}
            onChange={(event) => onChange({ ...state, sort: event.target.value as SortOption })}
            className="rounded-lg border border-anthracite-200 bg-white px-3 py-2 text-sm text-anthracite-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-anthracite-400 transition-colors hover:text-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
}
