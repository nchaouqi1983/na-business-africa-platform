"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export type SearchFilters = {
  city: string;
  type: string;
  budget: string;
};

export const budgetRanges = [
  { label: "Tous budgets", value: "" },
  { label: "Jusqu'à 4 000 000 MAD", value: "0-4000000" },
  { label: "4 000 000 – 7 000 000 MAD", value: "4000000-7000000" },
  { label: "7 000 000 – 10 000 000 MAD", value: "7000000-10000000" },
  { label: "10 000 000 MAD et plus", value: "10000000-" },
];

type SearchBarProps = {
  cities: string[];
  types: string[];
  variant?: "hero" | "panel";
  initialFilters?: SearchFilters;
  onSearch?: (filters: SearchFilters) => void;
};

export default function SearchBar({
  cities,
  types,
  variant = "panel",
  initialFilters,
  onSearch,
}: SearchBarProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>(
    initialFilters ?? { city: "", type: "", budget: "" }
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (onSearch) {
      onSearch(filters);
      return;
    }

    const params = new URLSearchParams();
    if (filters.city) params.set("ville", filters.city);
    if (filters.type) params.set("type", filters.type);
    if (filters.budget) params.set("budget", filters.budget);

    router.push(`/explorer${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const isHero = variant === "hero";

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        "flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-end sm:gap-4",
        isHero
          ? "border border-white/15 bg-anthracite-950/60 backdrop-blur-md"
          : "border border-anthracite-100 bg-white shadow-sm",
      ].join(" ")}
    >
      <label className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span
          className={`text-xs font-semibold uppercase tracking-wider ${
            isHero ? "text-anthracite-200" : "text-anthracite-500"
          }`}
        >
          Ville
        </span>
        <select
          value={filters.city}
          onChange={(event) => setFilters((prev) => ({ ...prev, city: event.target.value }))}
          className={[
            "w-full min-w-0 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500",
            isHero
              ? "border-white/20 bg-anthracite-900 text-white"
              : "border-anthracite-200 bg-white text-anthracite-900",
          ].join(" ")}
        >
          <option value="">Toutes les villes</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span
          className={`text-xs font-semibold uppercase tracking-wider ${
            isHero ? "text-anthracite-200" : "text-anthracite-500"
          }`}
        >
          Type de bien
        </span>
        <select
          value={filters.type}
          onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
          className={[
            "w-full min-w-0 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500",
            isHero
              ? "border-white/20 bg-anthracite-900 text-white"
              : "border-anthracite-200 bg-white text-anthracite-900",
          ].join(" ")}
        >
          <option value="">Tous les types</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span
          className={`text-xs font-semibold uppercase tracking-wider ${
            isHero ? "text-anthracite-200" : "text-anthracite-500"
          }`}
        >
          Budget
        </span>
        <select
          value={filters.budget}
          onChange={(event) => setFilters((prev) => ({ ...prev, budget: event.target.value }))}
          className={[
            "w-full min-w-0 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500",
            isHero
              ? "border-white/20 bg-anthracite-900 text-white"
              : "border-anthracite-200 bg-white text-anthracite-900",
          ].join(" ")}
        >
          {budgetRanges.map((range) => (
            <option key={range.label} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="shrink-0 whitespace-nowrap rounded-full bg-gold-500 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-anthracite-950 transition-colors hover:bg-gold-400"
      >
        Rechercher
      </button>
    </form>
  );
}
