"use client";

import { useMemo, type ReactNode } from "react";
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
  publicTagsForType,
  type Availability,
  type FilterGroupId,
  type FurnishedState,
  type Property,
  type PropertyCondition,
  type PropertyFilterState,
  type PropertyProximities,
  type PropertyTagDefinition,
  type TagCategory,
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

/** Libellés d'affichage éditoriaux — purement présentationnels, la configuration de lib/property-schema.ts n'est pas modifiée. */
const groupDisplayLabels: Partial<Record<FilterGroupId, string>> = {
  surfaces: "Caractéristiques",
  juridique: "Investissement & juridique",
};

type AdvancedFiltersProps = {
  properties: Property[];
  state: PropertyFilterState;
  onChange: (next: PropertyFilterState) => void;
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
  "rounded-lg border border-anthracite-200 bg-white px-3 py-2 text-sm text-anthracite-900 transition-colors focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40";

function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500",
        active
          ? "border-gold-500 bg-gold-500 text-anthracite-950"
          : "border-anthracite-200 text-anthracite-600 hover:border-gold-400 hover:text-anthracite-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function AdvancedFilters({ properties, state, onChange }: AdvancedFiltersProps) {
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
    <div className="flex flex-col gap-3">
      {subTypeOptions.length > 0 && (
        <div className="rounded-2xl border border-anthracite-100 bg-white p-4">
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
        </div>
      )}

      {visibleGroups.map((group) => (
        <details key={group.id} className="group rounded-2xl border border-anthracite-100 bg-white open:shadow-sm">
          <summary className="flex cursor-pointer select-none list-none items-center justify-between rounded-2xl px-5 py-4 text-xs font-semibold uppercase tracking-wider text-anthracite-700 marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500">
            {groupDisplayLabels[group.id] ?? group.label}
            <svg
              viewBox="0 0 12 12"
              className="h-3 w-3 shrink-0 text-anthracite-400 transition-transform group-open:rotate-180 group-open:text-gold-600"
              fill="none"
              aria-hidden="true"
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <div className="border-t border-anthracite-100 px-5 pb-5 pt-4">
            {group.id === "localisation" && (
              <div className="flex flex-col gap-4">
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
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Surface min (m²)">
                    <input type="number" min={0} value={state.surfaceMin} onChange={(event) => set("surfaceMin", event.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Surface max (m²)">
                    <input type="number" min={0} value={state.surfaceMax} onChange={(event) => set("surfaceMax", event.target.value)} className={inputClass} />
                  </Field>
                </div>
                <Field label="Prix au m² max">
                  <input type="number" min={0} value={state.pricePerSqmMax} onChange={(event) => set("pricePerSqmMax", event.target.value)} className={inputClass} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Chambres min.">
                    <input type="number" min={0} value={state.bedroomsMin} onChange={(event) => set("bedroomsMin", event.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Salles de bain min.">
                    <input type="number" min={0} value={state.bathroomsMin} onChange={(event) => set("bathroomsMin", event.target.value)} className={inputClass} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Parking min.">
                    <input type="number" min={0} value={state.parkingMin} onChange={(event) => set("parkingMin", event.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Étage">
                    <input type="number" value={state.floor} onChange={(event) => set("floor", event.target.value)} className={inputClass} />
                  </Field>
                </div>
              </div>
            )}

            {group.id === "etat" && (
              <div className="flex flex-col gap-4">
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
                    className={inputClass}
                  />
                </Field>
              </div>
            )}

            {group.id === "programme" && (
              <div className="flex flex-col gap-4">
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
  );
}
