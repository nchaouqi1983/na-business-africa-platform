"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  availabilityLabels,
  availabilityValues,
  conditionLabels,
  conditionValues,
  filterGroups,
  furnishedLabels,
  furnishedValues,
  isGroupRelevantForType,
  proximityFields,
  propertySubTypesByType,
  propertyTypeLabels,
  propertyTypeValues,
  publicTagsForType,
  sortOptions,
  transactionLabels,
  transactionValues,
  type Availability,
  type FurnishedState,
  type Property,
  type PropertyCondition,
  type PropertyFilterState,
  type PropertyProximities,
  type PropertyTagDefinition,
  type PropertyType,
  type SortOption,
  type TagCategory,
  type TransactionType,
} from "@/lib/property-schema";
import { developers } from "@/lib/properties";

const tagCategoryLabels: Record<TagCategory, string> = {
  exterieur: "Extérieur",
  confort: "Confort",
  securite: "Sécurité",
  loisirs: "Loisirs",
  technique: "Technique",
  juridique: "Juridique",
  marketing: "Arguments",
  vue: "Vues",
  environnement: "Environnement",
  proximite: "Proximité",
};

type FilterPanelProps = {
  properties: Property[];
  state: PropertyFilterState;
  onChange: (next: PropertyFilterState) => void;
  onReset: () => void;
  resultCount: number;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "rounded-lg border border-anthracite-200 bg-white px-3 py-2 text-sm text-anthracite-900 focus:outline-none focus:ring-2 focus:ring-gold-500";

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-gold-500 bg-gold-500 text-anthracite-950"
          : "border-anthracite-200 text-anthracite-600 hover:border-gold-400 hover:text-anthracite-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function FilterPanel({ properties, state, onChange, onReset, resultCount }: FilterPanelProps) {
  const [showMore, setShowMore] = useState(false);

  const cities = useMemo(
    () => Array.from(new Set(properties.map((property) => property.location.city))).sort(),
    [properties]
  );
  const districts = useMemo(
    () =>
      Array.from(
        new Set(
          properties
            .filter((property) => !state.city || property.location.city === state.city)
            .map((property) => property.location.district)
            .filter((district): district is string => Boolean(district))
        )
      ).sort(),
    [properties, state.city]
  );
  const programOptions = useMemo(
    () =>
      Array.from(new Set(properties.map((property) => property.programId).filter((id): id is string => Boolean(id)))).map(
        (programId) => {
          const sample = properties.find((property) => property.programId === programId);
          const label = sample?.details?.kind === "programme-neuf" ? sample.details.programName ?? programId : programId;
          return { value: programId, label: label ?? programId };
        }
      ),
    [properties]
  );

  const tagsByCategory = useMemo(() => {
    const groups = new Map<TagCategory, PropertyTagDefinition[]>();
    for (const tag of publicTagsForType(state.type)) {
      const list = groups.get(tag.category) ?? [];
      list.push(tag);
      groups.set(tag.category, list);
    }
    return groups;
  }, [state.type]);

  function set<K extends keyof PropertyFilterState>(key: K, value: PropertyFilterState[K]) {
    onChange({ ...state, [key]: value });
  }

  function toggleTag(slug: string) {
    set("tags", state.tags.includes(slug) ? state.tags.filter((tag) => tag !== slug) : [...state.tags, slug]);
  }

  const subTypeOptions = state.type ? propertySubTypesByType[state.type] : [];
  const visibleGroups = filterGroups.filter((group) => !group.essential && isGroupRelevantForType(group.id, state.type));

  return (
    <div className="rounded-2xl border border-anthracite-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Recherche">
            <input
              type="text"
              value={state.keyword}
              onChange={(event) => set("keyword", event.target.value)}
              placeholder="Mot-clé, titre, référence…"
              className={inputClass}
            />
          </Field>
          <Field label="Transaction">
            <select
              value={state.transaction}
              onChange={(event) => set("transaction", event.target.value as TransactionType | "")}
              className={inputClass}
            >
              <option value="">Toutes transactions</option>
              {transactionValues.map((value) => (
                <option key={value} value={value}>
                  {transactionLabels[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Type de bien">
            <select
              value={state.type}
              onChange={(event) =>
                onChange({ ...state, type: event.target.value as PropertyType | "", subType: "" })
              }
              className={inputClass}
            >
              <option value="">Tous les types</option>
              {propertyTypeValues.map((value) => (
                <option key={value} value={value}>
                  {propertyTypeLabels[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ville">
            <select
              value={state.city}
              onChange={(event) => set("city", event.target.value)}
              className={inputClass}
            >
              <option value="">Toutes les villes</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Budget min (MAD)">
            <input
              type="number"
              min={0}
              value={state.budgetMin}
              onChange={(event) => set("budgetMin", event.target.value)}
              placeholder="Aucun minimum"
              className={inputClass}
            />
          </Field>
          <Field label="Budget max (MAD)">
            <input
              type="number"
              min={0}
              value={state.budgetMax}
              onChange={(event) => set("budgetMax", event.target.value)}
              placeholder="Aucun maximum"
              className={inputClass}
            />
          </Field>
          <Field label="Trier par">
            <select value={state.sort} onChange={(event) => set("sort", event.target.value as SortOption)} className={inputClass}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => setShowMore((value) => !value)}
              className="flex-1 rounded-full border border-anthracite-300 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-anthracite-700 transition-colors hover:border-gold-500 hover:text-gold-600"
            >
              {showMore ? "Moins de filtres" : "Plus de filtres"}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-anthracite-400 transition-colors hover:text-anthracite-700"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        <p className="text-sm text-anthracite-500">
          {resultCount} bien{resultCount > 1 ? "s" : ""} correspondant{resultCount > 1 ? "s" : ""}
        </p>
      </div>

      {showMore && (
        <div className="flex flex-col gap-3 border-t border-anthracite-100 p-5 sm:p-6">
          {subTypeOptions.length > 0 && (
            <Field label="Sous-type">
              <select value={state.subType} onChange={(event) => set("subType", event.target.value)} className={inputClass}>
                <option value="">Tous les sous-types</option>
                {subTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {visibleGroups.map((group) => (
            <details key={group.id} className="group rounded-xl border border-anthracite-100 p-4 open:bg-anthracite-50/60">
              <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-anthracite-700">
                {group.label}
              </summary>
              <div className="mt-4">
                {group.id === "localisation" && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Quartier">
                      <select value={state.district} onChange={(event) => set("district", event.target.value)} className={inputClass}>
                        <option value="">Tous les quartiers</option>
                        {districts.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Proximité">
                      <select
                        value={state.proximityKey}
                        onChange={(event) => set("proximityKey", event.target.value as keyof PropertyProximities | "")}
                        className={inputClass}
                      >
                        <option value="">Indifférent</option>
                        {proximityFields.map((field) => (
                          <option key={field.key} value={field.key}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Distance max (km)">
                      <input
                        type="number"
                        min={0}
                        value={state.proximityMaxKm}
                        onChange={(event) => set("proximityMaxKm", event.target.value)}
                        disabled={!state.proximityKey}
                        placeholder="Ex. 5"
                        className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
                      />
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-anthracite-700">
                      <input
                        type="checkbox"
                        checked={state.onMapOnly}
                        onChange={(event) => set("onMapOnly", event.target.checked)}
                        className="accent-gold-500"
                      />
                      Uniquement les biens géolocalisés sur la carte
                    </label>
                  </div>
                )}

                {group.id === "surfaces" && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Surface min (m²)">
                      <input type="number" min={0} value={state.surfaceMin} onChange={(event) => set("surfaceMin", event.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Surface max (m²)">
                      <input type="number" min={0} value={state.surfaceMax} onChange={(event) => set("surfaceMax", event.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Prix au m² max">
                      <input type="number" min={0} value={state.pricePerSqmMax} onChange={(event) => set("pricePerSqmMax", event.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Chambres min.">
                      <input type="number" min={0} value={state.bedroomsMin} onChange={(event) => set("bedroomsMin", event.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Salles de bain min.">
                      <input type="number" min={0} value={state.bathroomsMin} onChange={(event) => set("bathroomsMin", event.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Parking min.">
                      <input type="number" min={0} value={state.parkingMin} onChange={(event) => set("parkingMin", event.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Étage">
                      <input type="number" value={state.floor} onChange={(event) => set("floor", event.target.value)} className={inputClass} />
                    </Field>
                  </div>
                )}

                {group.id === "etat" && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="État">
                      <select value={state.condition} onChange={(event) => set("condition", event.target.value as PropertyCondition | "")} className={inputClass}>
                        <option value="">Indifférent</option>
                        {conditionValues.map((value) => (
                          <option key={value} value={value}>
                            {conditionLabels[value]}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Meublé">
                      <select value={state.furnished} onChange={(event) => set("furnished", event.target.value as FurnishedState | "")} className={inputClass}>
                        <option value="">Indifférent</option>
                        {furnishedValues.map((value) => (
                          <option key={value} value={value}>
                            {furnishedLabels[value]}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Disponibilité">
                      <select value={state.availability} onChange={(event) => set("availability", event.target.value as Availability | "")} className={inputClass}>
                        <option value="">Indifférent</option>
                        {availabilityValues.map((value) => (
                          <option key={value} value={value}>
                            {availabilityLabels[value]}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}

                {group.id === "statut" && (
                  <div className="flex flex-wrap gap-2">
                    <ToggleChip active={state.exclusiveOnly} onClick={() => set("exclusiveOnly", !state.exclusiveOnly)}>
                      Exclusivité
                    </ToggleChip>
                    <ToggleChip active={state.newOnly} onClick={() => set("newOnly", !state.newOnly)}>
                      Nouveauté
                    </ToggleChip>
                    <ToggleChip active={state.offMarketOnly} onClick={() => set("offMarketOnly", !state.offMarketOnly)}>
                      Off Market
                    </ToggleChip>
                    <ToggleChip active={state.priceOnRequestOnly} onClick={() => set("priceOnRequestOnly", !state.priceOnRequestOnly)}>
                      Prix sur demande
                    </ToggleChip>
                    <ToggleChip active={state.coupDeCoeurOnly} onClick={() => set("coupDeCoeurOnly", !state.coupDeCoeurOnly)}>
                      Coup de cœur
                    </ToggleChip>
                    <ToggleChip active={state.bonneAffaireOnly} onClick={() => set("bonneAffaireOnly", !state.bonneAffaireOnly)}>
                      Bonne affaire
                    </ToggleChip>
                  </div>
                )}

                {group.id === "equipements" && (
                  <div className="flex flex-col gap-4">
                    {Array.from(tagsByCategory.entries()).map(([category, tags]) => (
                      <div key={category} className="flex flex-col gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-anthracite-400">
                          {tagCategoryLabels[category]}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <ToggleChip key={tag.slug} active={state.tags.includes(tag.slug)} onClick={() => toggleTag(tag.slug)}>
                              {tag.label.fr}
                            </ToggleChip>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {group.id === "juridique" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      <ToggleChip active={state.legalTitled} onClick={() => set("legalTitled", !state.legalTitled)}>
                        Titré
                      </ToggleChip>
                      <ToggleChip active={state.airbnbAllowed} onClick={() => set("airbnbAllowed", !state.airbnbAllowed)}>
                        Airbnb autorisé
                      </ToggleChip>
                      <ToggleChip active={state.creditEligible} onClick={() => set("creditEligible", !state.creditEligible)}>
                        Éligible crédit
                      </ToggleChip>
                      <ToggleChip active={state.mourabahaEligible} onClick={() => set("mourabahaEligible", !state.mourabahaEligible)}>
                        Éligible Mourabaha
                      </ToggleChip>
                    </div>
                    <Field label="Rendement estimé min. (%)">
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={state.minYield}
                        onChange={(event) => set("minYield", event.target.value)}
                        className={`${inputClass} max-w-xs`}
                      />
                    </Field>
                  </div>
                )}

                {group.id === "programme" && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Promoteur">
                      <select value={state.developerId} onChange={(event) => set("developerId", event.target.value)} className={inputClass}>
                        <option value="">Tous les promoteurs</option>
                        {developers.map((developer) => (
                          <option key={developer.id} value={developer.id}>
                            {developer.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Programme">
                      <select value={state.programId} onChange={(event) => set("programId", event.target.value)} className={inputClass}>
                        <option value="">Tous les programmes</option>
                        {programOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Livraison avant le">
                      <input
                        type="date"
                        value={state.deliveryBefore}
                        onChange={(event) => set("deliveryBefore", event.target.value)}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
