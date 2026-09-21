"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import Button from "@/components/Button";
import {
  defaultFilterState,
  filterAndSortProperties,
  propertyTypeLabels,
  properties,
  transactionValues,
  type PropertyFilterState,
  type PropertyType,
  type TransactionType,
} from "@/lib/properties";
import SearchEssentials from "./SearchEssentials";
import AdvancedFilters from "./AdvancedFilters";
import ResultsHeader from "./ResultsHeader";

function buildInitialState(searchParams: URLSearchParams): PropertyFilterState {
  const state: PropertyFilterState = { ...defaultFilterState };

  const ville = searchParams.get("ville");
  if (ville) state.city = ville;

  const transaction = searchParams.get("transaction");
  if (transaction && (transactionValues as readonly string[]).includes(transaction)) {
    state.transaction = transaction as TransactionType;
  }

  const typeLabel = searchParams.get("type");
  if (typeLabel) {
    const entry = (Object.entries(propertyTypeLabels) as [PropertyType, string][]).find(
      ([, label]) => label === typeLabel
    );
    if (entry) state.type = entry[0];
  }

  const budget = searchParams.get("budget");
  if (budget) {
    const [min, max] = budget.split("-");
    if (min) state.budgetMin = min;
    if (max) state.budgetMax = max;
  }

  return state;
}

export default function ExplorerResults() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<PropertyFilterState>(() => buildInitialState(searchParams));
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const cities = useMemo(
    () => Array.from(new Set(properties.map((property) => property.location.city))).sort(),
    []
  );
  const filtered = useMemo(() => filterAndSortProperties(properties, filters), [filters]);

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
          <AdvancedFilters properties={properties} state={filters} onChange={setFilters} />
        </aside>

        <div className="flex flex-col gap-8">
          <ResultsHeader state={filters} resultCount={filtered.length} onChange={setFilters} onReset={resetFilters} />

          {filtered.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-anthracite-200 bg-anthracite-50 px-6 py-20 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/60 text-gold-500">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path strokeLinecap="round" d="m20 20-3.5-3.5" />
                </svg>
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-anthracite-900">
                  Aucun bien ne correspond à cette recherche
                </p>
                <p className="mt-2 text-sm text-anthracite-500">
                  Essayez d&apos;élargir vos critères ou réinitialisez les filtres pour retrouver l&apos;ensemble du
                  portefeuille.
                </p>
              </div>
              <Button variant="primary" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
