"use client";

import {
  propertyTypeLabels,
  propertyTypeValues,
  transactionLabels,
  transactionValues,
  type PropertyFilterState,
  type PropertyType,
  type TransactionType,
} from "@/lib/property-schema";

type SearchEssentialsProps = {
  state: PropertyFilterState;
  cities: string[];
  advancedOpen: boolean;
  onChange: (next: PropertyFilterState) => void;
  onToggleAdvanced: () => void;
};

const fieldLabelClass = "text-xs font-semibold uppercase tracking-wider text-anthracite-500";
const inputClass =
  "rounded-lg border border-anthracite-200 bg-white px-3 py-2.5 text-sm text-anthracite-900 transition-colors focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40";

export default function SearchEssentials({
  state,
  cities,
  advancedOpen,
  onChange,
  onToggleAdvanced,
}: SearchEssentialsProps) {
  function set<K extends keyof PropertyFilterState>(key: K, value: PropertyFilterState[K]) {
    onChange({ ...state, [key]: value });
  }

  return (
    <div className="rounded-2xl border border-anthracite-100 bg-white/95 p-5 shadow-2xl shadow-anthracite-950/10 backdrop-blur sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Type de transaction"
          className="flex flex-wrap gap-1 rounded-full border border-anthracite-200 p-1"
        >
          <button
            type="button"
            onClick={() => set("transaction", "")}
            aria-pressed={state.transaction === ""}
            className={[
              "rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500",
              state.transaction === ""
                ? "bg-anthracite-950 text-white"
                : "text-anthracite-500 hover:text-anthracite-900",
            ].join(" ")}
          >
            Toutes
          </button>
          {transactionValues.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => set("transaction", value as TransactionType)}
              aria-pressed={state.transaction === value}
              className={[
                "rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500",
                state.transaction === value
                  ? "bg-anthracite-950 text-white"
                  : "text-anthracite-500 hover:text-anthracite-900",
              ].join(" ")}
            >
              {transactionLabels[value]}
            </button>
          ))}
        </div>
        <span className="text-xs text-anthracite-400">
          Recherche instantanée — les résultats se mettent à jour automatiquement.
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1.5 lg:col-span-2">
          <span className={fieldLabelClass}>Recherche</span>
          <input
            type="text"
            value={state.keyword}
            onChange={(event) => set("keyword", event.target.value)}
            placeholder="Mot-clé, titre, référence…"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={fieldLabelClass}>Ville</span>
          <select value={state.city} onChange={(event) => set("city", event.target.value)} className={inputClass}>
            <option value="">Toutes les villes</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={fieldLabelClass}>Type de bien</span>
          <select
            value={state.type}
            onChange={(event) => onChange({ ...state, type: event.target.value as PropertyType | "", subType: "" })}
            className={inputClass}
          >
            <option value="">Tous les types</option>
            {propertyTypeValues.map((value) => (
              <option key={value} value={value}>
                {propertyTypeLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={fieldLabelClass}>Budget (MAD)</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={state.budgetMin}
              onChange={(event) => set("budgetMin", event.target.value)}
              placeholder="Min"
              aria-label="Budget minimum en MAD"
              className={inputClass}
            />
            <span className="text-anthracite-300" aria-hidden="true">
              –
            </span>
            <input
              type="number"
              min={0}
              value={state.budgetMax}
              onChange={(event) => set("budgetMax", event.target.value)}
              placeholder="Max"
              aria-label="Budget maximum en MAD"
              className={inputClass}
            />
          </div>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-anthracite-100 pt-5">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-anthracite-400">
          Catégories
        </span>
        <button
          type="button"
          onClick={() => onChange({ ...state, type: "", subType: "" })}
          aria-pressed={state.type === ""}
          className={[
            "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500",
            state.type === ""
              ? "border-gold-500 bg-gold-500 text-anthracite-950"
              : "border-anthracite-200 text-anthracite-600 hover:border-gold-400 hover:text-anthracite-900",
          ].join(" ")}
        >
          Toutes les catégories
        </button>
        {propertyTypeValues.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange({ ...state, type: value, subType: "" })}
            aria-pressed={state.type === value}
            className={[
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500",
              state.type === value
                ? "border-gold-500 bg-gold-500 text-anthracite-950"
                : "border-anthracite-200 text-anthracite-600 hover:border-gold-400 hover:text-anthracite-900",
            ].join(" ")}
          >
            {propertyTypeLabels[value]}
          </button>
        ))}
      </div>

      <div className="mt-5 flex justify-end border-t border-anthracite-100 pt-5">
        <button
          type="button"
          onClick={onToggleAdvanced}
          aria-expanded={advancedOpen}
          className="inline-flex items-center gap-2 rounded-full border border-anthracite-300 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-anthracite-700 transition-colors hover:border-gold-500 hover:text-gold-600 lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
        >
          {advancedOpen ? "Masquer les filtres avancés" : "Plus de filtres"}
          <svg
            viewBox="0 0 12 12"
            className={`h-3 w-3 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
            fill="none"
            aria-hidden="true"
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
