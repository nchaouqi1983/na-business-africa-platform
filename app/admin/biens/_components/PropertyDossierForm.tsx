"use client";

import { useActionState, useMemo, useState } from "react";
import Button from "@/components/Button";
import type { PropertyFormState } from "@/lib/admin/property-actions";
import {
  transactionOptions,
  propertyTypeOptions,
  subtypeOptionsForType,
  propertyStatusOptions,
  visibilityOptions,
  conditionOptions,
  furnishedOptions,
  orientationOptions,
  type PropertyBusinessStatus,
} from "@/lib/admin/property-enum-maps";
import { moroccoCityNames, districtsForCity } from "@/lib/admin/geo-taxonomy";
import { propertyTypeGroup } from "@/lib/property-schema";
import type {
  PropertyType,
  TransactionType,
  PropertyCondition,
  FurnishedState,
  Orientation,
} from "@/lib/property-schema";
import type { PropertyDetailsInput } from "@/lib/admin/property-details-schema";
import type { Visibility as DbVisibility } from "@/lib/generated/prisma/enums";
import type { PropertyMediaDto } from "@/lib/admin/property-media-dto";
import type { PropertyDocumentDto } from "@/lib/admin/property-document-dto";
import type { PropertyExternalLinkDto } from "@/lib/admin/property-external-link-dto";
import { Field, CheckboxField, inputClass } from "./FormField";
import PropertyLocationMap from "./PropertyLocationMap";
import TagPicker, { type TagPickerOption } from "./TagPicker";
import PropertyDetailsFields from "./PropertyDetailsFields";
import PropertyMediaManager from "./PropertyMediaManager";
import PropertyDocumentManager from "./PropertyDocumentManager";
import PropertyExternalLinkManager from "./PropertyExternalLinkManager";

export type PropertyDossierDefaults = {
  titleFr?: string;
  shortDescription?: string;
  descriptionFr?: string;
  transaction?: TransactionType;
  propertyType?: PropertyType;
  propertySubtype?: string;
  status?: PropertyBusinessStatus;
  visibility?: DbVisibility;
  isFeatured?: boolean;
  isGoodDeal?: boolean;
  isCoupDeCoeur?: boolean;
  assignedToId?: string;

  city?: string;
  district?: string;
  addressPublic?: string;
  latitude?: number;
  longitude?: number;
  proximityNotes?: string;

  price?: number;
  priceOnRequest?: boolean;
  pricePerSqm?: number;
  negotiable?: boolean;
  agencyFeePercent?: number;
  monthlyCharges?: number;
  securityDeposit?: number;
  estimatedYieldPercent?: number;
  isCreditEligible?: boolean;
  isMourabahaEligible?: boolean;

  livingArea?: number;
  builtArea?: number;
  landArea?: number;
  terraceArea?: number;
  balconyArea?: number;
  basementArea?: number;
  bedrooms?: number;
  suites?: number;
  bathrooms?: number;
  salons?: number;
  kitchens?: number;
  parkingSpaces?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  condition?: PropertyCondition;
  furnished?: FurnishedState;
  orientation?: Orientation;

  details?: PropertyDetailsInput;
  tagSlugs?: string[];
};

type AssignableUser = { id: string; name: string | null; email: string; role: string };

type PropertyDossierFormProps = {
  action: (prevState: PropertyFormState, formData: FormData) => Promise<PropertyFormState>;
  submitLabel: string;
  defaultValues?: PropertyDossierDefaults;
  allTags: TagPickerOption[];
  canCreateTag: boolean;
  canAssign: boolean;
  assignableUsers: AssignableUser[];
  /** Absent on the "nouveau bien" creation form — the bien has no id yet. */
  propertyId?: string;
  initialMedia?: PropertyMediaDto[];
  canUploadMedia?: boolean;
  initialDocuments?: PropertyDocumentDto[];
  initialLinks?: PropertyExternalLinkDto[];
  canManageDocuments?: boolean;
  canManageRestrictedDocuments?: boolean;
};

type SectionKey = "identite" | "localisation" | "prix" | "surfaces" | "caracteristiques" | "tags" | "medias";

export default function PropertyDossierForm({
  action,
  submitLabel,
  defaultValues,
  allTags,
  canCreateTag,
  canAssign,
  assignableUsers,
  propertyId,
  initialMedia,
  canUploadMedia,
  initialDocuments,
  initialLinks,
  canManageDocuments,
  canManageRestrictedDocuments,
}: PropertyDossierFormProps) {
  const [state, formAction, pending] = useActionState<PropertyFormState, FormData>(action, undefined);

  const [activeSection, setActiveSection] = useState<SectionKey>("identite");
  const [propertyType, setPropertyType] = useState<PropertyType | "">(defaultValues?.propertyType ?? "");
  const [transaction, setTransaction] = useState<TransactionType | "">(defaultValues?.transaction ?? "");
  const [visibility, setVisibility] = useState<DbVisibility | "">(defaultValues?.visibility ?? "PUBLIC");
  const [priceOnRequest, setPriceOnRequest] = useState(defaultValues?.priceOnRequest ?? false);
  const [city, setCity] = useState(defaultValues?.city ?? "");
  const [district, setDistrict] = useState(defaultValues?.district ?? "");
  const [addressPublic, setAddressPublic] = useState(defaultValues?.addressPublic ?? "");
  const [latInput, setLatInput] = useState(defaultValues?.latitude?.toString() ?? "");
  const [lngInput, setLngInput] = useState(defaultValues?.longitude?.toString() ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(defaultValues?.tagSlugs ?? []);

  const group = propertyType ? propertyTypeGroup[propertyType] : undefined;
  const subtypeOptions = subtypeOptionsForType(propertyType);
  const districtOptions = districtsForCity(city);
  const showRentalFields = transaction === "location" || transaction === "location-saisonniere";
  const isOffMarketOrPrivate = visibility === "OFF_MARKET" || visibility === "PRIVE";

  const parsedLat = Number(latInput);
  const parsedLng = Number(lngInput);
  const hasCoords = latInput.trim() !== "" && lngInput.trim() !== "" && Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

  // Never overwrites a value the admin already typed — only fills empty fields.
  function handleSuggestPlace(fields: { city?: string; district?: string; addressPublic?: string }) {
    if (fields.city && !city.trim()) setCity(fields.city);
    if (fields.district && !district.trim()) setDistrict(fields.district);
    if (fields.addressPublic && !addressPublic.trim()) setAddressPublic(fields.addressPublic);
  }

  const sections = useMemo(
    () =>
      [
        { key: "identite" as const, label: "Identité & publication", complete: Boolean(defaultValues?.titleFr) },
        { key: "localisation" as const, label: "Localisation & carte", complete: Boolean(defaultValues?.city) },
        {
          key: "prix" as const,
          label: "Prix & commercialisation",
          complete: Boolean(defaultValues?.price || defaultValues?.priceOnRequest),
        },
        {
          key: "surfaces" as const,
          label: "Surfaces & pièces",
          complete: Boolean(defaultValues?.livingArea || defaultValues?.bedrooms || defaultValues?.bathrooms),
        },
        {
          key: "caracteristiques" as const,
          label: "Caractéristiques",
          complete: Boolean(defaultValues?.details && Object.keys(defaultValues.details).length > 1),
        },
        { key: "tags" as const, label: "Tags & équipements", complete: (defaultValues?.tagSlugs?.length ?? 0) > 0 },
        {
          key: "medias" as const,
          label: "Médias",
          complete:
            (initialMedia?.length ?? 0) > 0 || (initialDocuments?.length ?? 0) > 0 || (initialLinks?.length ?? 0) > 0,
        },
      ] satisfies { key: SectionKey; label: string; complete: boolean }[],
    [defaultValues, initialMedia, initialDocuments, initialLinks]
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="-mx-1 flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Sections du dossier">
        {sections.map((section) => (
          <button
            key={section.key}
            type="button"
            role="tab"
            aria-selected={activeSection === section.key}
            onClick={() => setActiveSection(section.key)}
            className={[
              "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-gold-400",
              activeSection === section.key
                ? "bg-anthracite-950 text-white"
                : "bg-anthracite-50 text-anthracite-500 hover:bg-anthracite-100",
            ].join(" ")}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${section.complete ? "bg-emerald-400" : "bg-anthracite-300"}`}
              aria-hidden="true"
            />
            {section.label}
          </button>
        ))}
      </div>

      {/* 1. Identité & publication */}
      <section hidden={activeSection !== "identite"} className="flex flex-col gap-5">
        <Field label="Titre" error={state?.fieldErrors?.titleFr}>
          <input name="titleFr" required defaultValue={defaultValues?.titleFr} className={inputClass} />
        </Field>
        <Field label="Description courte" error={state?.fieldErrors?.shortDescription}>
          <input
            name="shortDescription"
            maxLength={240}
            defaultValue={defaultValues?.shortDescription}
            className={inputClass}
          />
        </Field>
        <Field label="Description complète" error={state?.fieldErrors?.descriptionFr}>
          <textarea name="descriptionFr" rows={5} defaultValue={defaultValues?.descriptionFr} className={inputClass} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Transaction" error={state?.fieldErrors?.transaction}>
            <select
              name="transaction"
              required
              defaultValue={defaultValues?.transaction ?? ""}
              onChange={(event) => setTransaction(event.target.value as TransactionType)}
              className={inputClass}
            >
              <option value="" disabled>
                Sélectionner…
              </option>
              {transactionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Type de bien" error={state?.fieldErrors?.propertyType}>
            <select
              name="propertyType"
              required
              defaultValue={defaultValues?.propertyType ?? ""}
              onChange={(event) => setPropertyType(event.target.value as PropertyType)}
              className={inputClass}
            >
              <option value="" disabled>
                Sélectionner…
              </option>
              {propertyTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Sous-type" error={state?.fieldErrors?.propertySubtype}>
            <select
              name="propertySubtype"
              defaultValue={defaultValues?.propertySubtype ?? ""}
              disabled={subtypeOptions.length === 0}
              className={inputClass}
            >
              <option value="">—</option>
              {subtypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Statut" error={state?.fieldErrors?.status}>
            <select name="status" defaultValue={defaultValues?.status ?? "disponible"} className={inputClass}>
              {propertyStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Visibilité" error={state?.fieldErrors?.visibility}>
            <select
              name="visibility"
              defaultValue={defaultValues?.visibility ?? "PUBLIC"}
              onChange={(event) => setVisibility(event.target.value as DbVisibility)}
              className={inputClass}
            >
              {visibilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          {canAssign && (
            <Field label="Assigné à" error={state?.fieldErrors?.assignedToId}>
              <select name="assignedToId" defaultValue={defaultValues?.assignedToId ?? ""} className={inputClass}>
                <option value="">— Personne —</option>
                {assignableUsers.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>
                    {(assignee.name ?? assignee.email) + (assignee.role === "AGENT" ? " (Agent)" : " (Éditeur)")}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>

        <div className="flex flex-wrap gap-6 rounded-2xl border border-anthracite-100 p-4">
          <CheckboxField label="À la une" name="isFeatured" defaultChecked={defaultValues?.isFeatured} />
          <CheckboxField label="Bonne affaire" name="isGoodDeal" defaultChecked={defaultValues?.isGoodDeal} />
          <CheckboxField label="Coup de cœur" name="isCoupDeCoeur" defaultChecked={defaultValues?.isCoupDeCoeur} />
        </div>
      </section>

      {/* 2. Localisation & carte */}
      <section hidden={activeSection !== "localisation"} className="flex flex-col gap-5">
        {isOffMarketOrPrivate && (
          <p className="rounded-xl bg-anthracite-50 px-4 py-3 text-xs text-anthracite-600">
            Visibilité {visibility === "OFF_MARKET" ? "Off-market" : "Privée"} : l&apos;adresse et le quartier précis
            de ce bien ne seront jamais affichés côté public.
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Ville" error={state?.fieldErrors?.city}>
            <input
              name="city"
              list="city-suggestions"
              required
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className={inputClass}
            />
            <datalist id="city-suggestions">
              {moroccoCityNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </Field>

          <Field label="Quartier" error={state?.fieldErrors?.district}>
            <input
              name="district"
              list="district-suggestions"
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              className={inputClass}
            />
            <datalist id="district-suggestions">
              {districtOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </Field>

          <Field label="Adresse publique" error={state?.fieldErrors?.addressPublic}>
            <input
              name="addressPublic"
              value={addressPublic}
              onChange={(event) => setAddressPublic(event.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude" error={state?.fieldErrors?.latitude}>
              <input
                name="latitude"
                type="number"
                step="any"
                min={-90}
                max={90}
                value={latInput}
                onChange={(event) => setLatInput(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Longitude" error={state?.fieldErrors?.longitude}>
              <input
                name="longitude"
                type="number"
                step="any"
                min={-180}
                max={180}
                value={lngInput}
                onChange={(event) => setLngInput(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <PropertyLocationMap
          latitude={hasCoords ? parsedLat : undefined}
          longitude={hasCoords ? parsedLng : undefined}
          city={city}
          district={district}
          active={activeSection === "localisation"}
          onLocationChange={(lat, lng) => {
            setLatInput(lat.toFixed(6));
            setLngInput(lng.toFixed(6));
          }}
          onResetPin={() => {
            setLatInput("");
            setLngInput("");
          }}
          onSuggestPlace={handleSuggestPlace}
        />

        <Field label="Rayon de proximité / points d'intérêt" error={state?.fieldErrors?.proximityNotes}>
          <textarea
            name="proximityNotes"
            rows={3}
            placeholder="ex. Plage à 5 min à pied, golf à 10 min en voiture, école française à proximité…"
            defaultValue={defaultValues?.proximityNotes}
            className={inputClass}
          />
        </Field>
      </section>

      {/* 3. Prix & commercialisation */}
      <section hidden={activeSection !== "prix"} className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-anthracite-100 p-5">
          <label className="flex items-center gap-2 text-sm text-anthracite-800">
            <input
              type="checkbox"
              name="priceOnRequest"
              checked={priceOnRequest}
              onChange={(event) => setPriceOnRequest(event.target.checked)}
              className="h-4 w-4 rounded border-anthracite-300"
            />
            Prix sur demande
          </label>
          {!priceOnRequest && (
            <Field label="Prix (MAD)" error={state?.fieldErrors?.price}>
              <input
                name="price"
                type="number"
                min="0"
                step="1"
                defaultValue={defaultValues?.price}
                className={inputClass}
              />
            </Field>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Prix / m² (MAD)" error={state?.fieldErrors?.pricePerSqm}>
            <input
              name="pricePerSqm"
              type="number"
              min="0"
              step="1"
              defaultValue={defaultValues?.pricePerSqm}
              className={inputClass}
            />
          </Field>
          <Field label="Frais d'agence (%)" error={state?.fieldErrors?.agencyFeePercent}>
            <input
              name="agencyFeePercent"
              type="number"
              min="0"
              max="100"
              step="0.1"
              defaultValue={defaultValues?.agencyFeePercent}
              className={inputClass}
            />
          </Field>
          <Field label="Rendement brut estimé (%)" error={state?.fieldErrors?.estimatedYieldPercent}>
            <input
              name="estimatedYieldPercent"
              type="number"
              min="0"
              max="100"
              step="0.1"
              defaultValue={defaultValues?.estimatedYieldPercent}
              className={inputClass}
            />
          </Field>
          {showRentalFields && (
            <>
              <Field label="Charges mensuelles (MAD)" error={state?.fieldErrors?.monthlyCharges}>
                <input
                  name="monthlyCharges"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={defaultValues?.monthlyCharges}
                  className={inputClass}
                />
              </Field>
              <Field label="Dépôt de garantie (MAD)" error={state?.fieldErrors?.securityDeposit}>
                <input
                  name="securityDeposit"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={defaultValues?.securityDeposit}
                  className={inputClass}
                />
              </Field>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-6 rounded-2xl border border-anthracite-100 p-4">
          <CheckboxField label="Négociable" name="negotiable" defaultChecked={defaultValues?.negotiable} />
          <CheckboxField
            label="Éligible crédit"
            name="isCreditEligible"
            defaultChecked={defaultValues?.isCreditEligible}
          />
          <CheckboxField
            label="Éligible Mourabaha"
            name="isMourabahaEligible"
            defaultChecked={defaultValues?.isMourabahaEligible}
          />
        </div>
      </section>

      {/* 4. Surfaces & pièces */}
      <section hidden={activeSection !== "surfaces"} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Surface habitable (m²)" error={state?.fieldErrors?.livingArea}>
            <input name="livingArea" type="number" min="0" step="0.01" defaultValue={defaultValues?.livingArea} className={inputClass} />
          </Field>
          <Field label="Surface bâtie (m²)" error={state?.fieldErrors?.builtArea}>
            <input name="builtArea" type="number" min="0" step="0.01" defaultValue={defaultValues?.builtArea} className={inputClass} />
          </Field>
          <Field label="Surface terrain (m²)" error={state?.fieldErrors?.landArea}>
            <input name="landArea" type="number" min="0" step="0.01" defaultValue={defaultValues?.landArea} className={inputClass} />
          </Field>
          <Field label="Terrasse (m²)" error={state?.fieldErrors?.terraceArea}>
            <input name="terraceArea" type="number" min="0" step="0.01" defaultValue={defaultValues?.terraceArea} className={inputClass} />
          </Field>
          <Field label="Balcon (m²)" error={state?.fieldErrors?.balconyArea}>
            <input name="balconyArea" type="number" min="0" step="0.01" defaultValue={defaultValues?.balconyArea} className={inputClass} />
          </Field>
          <Field label="Sous-sol (m²)" error={state?.fieldErrors?.basementArea}>
            <input name="basementArea" type="number" min="0" step="0.01" defaultValue={defaultValues?.basementArea} className={inputClass} />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-4">
          <Field label="Chambres" error={state?.fieldErrors?.bedrooms}>
            <input name="bedrooms" type="number" min="0" step="1" defaultValue={defaultValues?.bedrooms} className={inputClass} />
          </Field>
          <Field label="Suites" error={state?.fieldErrors?.suites}>
            <input name="suites" type="number" min="0" step="1" defaultValue={defaultValues?.suites} className={inputClass} />
          </Field>
          <Field label="Salles de bain" error={state?.fieldErrors?.bathrooms}>
            <input name="bathrooms" type="number" min="0" step="1" defaultValue={defaultValues?.bathrooms} className={inputClass} />
          </Field>
          <Field label="Salons" error={state?.fieldErrors?.salons}>
            <input name="salons" type="number" min="0" step="1" defaultValue={defaultValues?.salons} className={inputClass} />
          </Field>
          <Field label="Cuisines" error={state?.fieldErrors?.kitchens}>
            <input name="kitchens" type="number" min="0" step="1" defaultValue={defaultValues?.kitchens} className={inputClass} />
          </Field>
          <Field label="Places parking" error={state?.fieldErrors?.parkingSpaces}>
            <input name="parkingSpaces" type="number" min="0" step="1" defaultValue={defaultValues?.parkingSpaces} className={inputClass} />
          </Field>
          <Field label="Étage" error={state?.fieldErrors?.floor}>
            <input name="floor" type="number" min="0" step="1" defaultValue={defaultValues?.floor} className={inputClass} />
          </Field>
          <Field label="Nombre d'étages" error={state?.fieldErrors?.totalFloors}>
            <input name="totalFloors" type="number" min="0" step="1" defaultValue={defaultValues?.totalFloors} className={inputClass} />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-4">
          <Field label="Année de construction" error={state?.fieldErrors?.yearBuilt}>
            <input name="yearBuilt" type="number" min="1900" step="1" defaultValue={defaultValues?.yearBuilt} className={inputClass} />
          </Field>
          <Field label="État">
            <select name="condition" defaultValue={defaultValues?.condition ?? ""} className={inputClass}>
              <option value="">—</option>
              {conditionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Meublé">
            <select name="furnished" defaultValue={defaultValues?.furnished ?? ""} className={inputClass}>
              <option value="">—</option>
              {furnishedOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Orientation">
            <select name="orientation" defaultValue={defaultValues?.orientation ?? ""} className={inputClass}>
              <option value="">—</option>
              {orientationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* 5. Caractéristiques conditionnelles */}
      <section hidden={activeSection !== "caracteristiques"} className="flex flex-col gap-5">
        {group ? (
          <PropertyDetailsFields group={group} defaults={defaultValues?.details} fieldErrors={state?.fieldErrors} />
        ) : (
          <p className="text-sm text-anthracite-400">
            Sélectionnez d&apos;abord un type de bien dans l&apos;onglet « Identité &amp; publication ».
          </p>
        )}
      </section>

      {/* 6. Tags & équipements */}
      <section hidden={activeSection !== "tags"} className="flex flex-col gap-5">
        <TagPicker allTags={allTags} selected={selectedTags} onChange={setSelectedTags} canCreateTag={canCreateTag} />
      </section>

      {/* 7. Médias */}
      <section hidden={activeSection !== "medias"} className="flex flex-col gap-8">
        {propertyId ? (
          <>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-anthracite-500">Images</h3>
                <span className="text-xs text-anthracite-500">{(initialMedia ?? []).length} photo(s)</span>
              </div>
              <PropertyMediaManager propertyId={propertyId} initialMedia={initialMedia ?? []} canUpload={Boolean(canUploadMedia)} />
            </div>

            <div className="border-t border-anthracite-100 pt-6">
              <PropertyDocumentManager
                propertyId={propertyId}
                initialDocuments={initialDocuments ?? []}
                canManage={Boolean(canManageDocuments)}
                canManageRestricted={Boolean(canManageRestrictedDocuments)}
                offMarket={isOffMarketOrPrivate}
              />
            </div>

            <div className="border-t border-anthracite-100 pt-6">
              <PropertyExternalLinkManager
                propertyId={propertyId}
                initialLinks={initialLinks ?? []}
                canManage={Boolean(canManageDocuments)}
                offMarket={isOffMarketOrPrivate}
              />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-anthracite-200 bg-anthracite-50 p-8 text-center text-sm text-anthracite-500">
            Enregistrez d&apos;abord ce brouillon pour pouvoir ajouter des photos, documents ou liens.
          </div>
        )}
      </section>

      <div className="flex items-center gap-3 border-t border-anthracite-100 pt-6">
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
