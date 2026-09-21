"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import SearchBar, { type SearchFilters } from "@/components/SearchBar";
import { getCities, properties, propertyTypes } from "@/lib/properties";

export default function ExplorerResults() {
  const searchParams = useSearchParams();
  const cities = getCities();

  const [filters, setFilters] = useState<SearchFilters>({
    city: searchParams.get("ville") ?? "",
    type: searchParams.get("type") ?? "",
    budget: searchParams.get("budget") ?? "",
  });

  const filtered = useMemo(() => {
    const [minRaw, maxRaw] = filters.budget.split("-");
    const min = minRaw ? Number(minRaw) : undefined;
    const max = maxRaw ? Number(maxRaw) : undefined;

    return properties.filter((property) => {
      if (filters.city && property.city !== filters.city) return false;
      if (filters.type && property.type !== filters.type) return false;
      if (min !== undefined && property.price < min) return false;
      if (max !== undefined && property.price > max) return false;
      return true;
    });
  }, [filters]);

  return (
    <div className="flex flex-col gap-10">
      <SearchBar
        cities={cities.map((city) => city.name)}
        types={propertyTypes}
        initialFilters={filters}
        onSearch={setFilters}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-anthracite-500">
          {filtered.length} bien{filtered.length > 1 ? "s" : ""} correspondant
          {filtered.length > 1 ? "s" : ""}
        </p>
      </div>

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
            Essayez d&apos;élargir vos critères de ville, type ou budget.
          </p>
        </div>
      )}
    </div>
  );
}
