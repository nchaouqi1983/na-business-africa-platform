"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import {
  defaultFilterState,
  filterAndSortProperties,
  propertyTypeLabels,
  properties,
  type PropertyFilterState,
  type PropertyType,
} from "@/lib/properties";
import FilterPanel from "./FilterPanel";

function buildInitialState(searchParams: URLSearchParams): PropertyFilterState {
  const state: PropertyFilterState = { ...defaultFilterState };

  const ville = searchParams.get("ville");
  if (ville) state.city = ville;

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

  const filtered = useMemo(() => filterAndSortProperties(properties, filters), [filters]);

  return (
    <div className="flex flex-col gap-10">
      <FilterPanel
        properties={properties}
        state={filters}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilterState)}
        resultCount={filtered.length}
      />

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-anthracite-200 bg-anthracite-50 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-anthracite-900">
            Aucun bien ne correspond à cette recherche
          </p>
          <p className="mt-2 text-sm text-anthracite-500">
            Essayez d&apos;élargir vos critères ou de réinitialiser les filtres.
          </p>
        </div>
      )}
    </div>
  );
}
