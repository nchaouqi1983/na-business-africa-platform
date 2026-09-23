import "server-only";
import {
  transactionValues,
  transactionLabels,
  propertyTypeValues,
  propertyTypeLabels,
  propertyTypeGroup,
  furnishedValues,
  furnishedLabels,
  conditionValues,
  conditionLabels,
  orientationValues,
  orientationLabels,
  availabilityValues,
  availabilityLabels,
  type TransactionType,
  type PropertyType,
  type PropertyTypeGroup,
  type FurnishedState,
  type PropertyCondition,
  type Orientation,
  type Availability,
} from "@/lib/property-schema";
import {
  propertyStatusValues,
  propertyStatusLabels,
  visibilityValues,
  visibilityLabels,
  isValidSubtype,
  transactionToDb,
  propertyTypeToDb,
  propertyStatusToDb,
  furnishedToDb,
  conditionToDb,
  orientationToDb,
  availabilityToDb,
  type PropertyBusinessStatus,
} from "@/lib/admin/property-enum-maps";
import { detailsSchemaForGroup, type PropertyDetailsInput } from "@/lib/admin/property-details-schema";
import { slugify } from "@/lib/admin/slugify";
import type {
  PropertyTransaction as DbTransaction,
  PropertyType as DbPropertyType,
  PropertyStatus as DbPropertyStatus,
  Visibility as DbVisibility,
  FurnishedState as DbFurnishedState,
  PropertyCondition as DbPropertyCondition,
  Orientation as DbOrientation,
  PropertyAvailability as DbAvailability,
} from "@/lib/generated/prisma/enums";

const currentYear = new Date().getFullYear();

/**
 * Pilot CSV contract for phase 6J1/6J2 — exact column set documented in the
 * "Télécharger le modèle CSV" button and the in-app mapping guide
 * (app/admin/imports/nouveau). Order here is the order written to the
 * downloadable template. The parser tolerates unknown extra columns
 * (ignored + reported) and columns from this list that are entirely absent
 * from a given file (treated as blank on every row) — only the columns in
 * REQUIRED_IMPORT_COLUMNS must actually be present.
 */
export const CORE_COLUMNS = [
  "source_external_id",
  "titre",
  "transaction",
  "type_bien",
  "sous_type",
] as const;

export const LOCATION_COLUMNS = ["ville", "quartier", "adresse_publique", "latitude", "longitude", "rayon_proximite"] as const;

export const COMMERCIAL_COLUMNS = [
  "prix_mad",
  "devise",
  "prix_sur_demande",
  "prix_m2",
  "negociable",
  "frais_agence",
  "rendement_estime",
] as const;

export const SURFACE_COLUMNS = ["surface_habitable", "surface_terrain", "surface_construite", "terrasse", "balcon", "sous_sol"] as const;

export const ROOM_COLUMNS = [
  "chambres",
  "suites",
  "salles_de_bain",
  "salons",
  "cuisines",
  "parking",
  "etages",
  "annee_construction",
] as const;

export const CONDITION_COLUMNS = ["etat", "meuble", "orientation", "disponibilite"] as const;

export const MARKETING_COLUMNS = ["a_la_une", "bonne_affaire", "coup_de_coeur", "exclusif"] as const;

export const CONTENT_COLUMNS = ["description_courte", "description_complete", "tags"] as const;

export const STATUS_COLUMNS = ["statut", "visibilite"] as const;

export const IMAGE_COLUMNS = ["image_urls"] as const;

type DetailFieldKind = "bool" | "raw";
type DetailColumnConfig = { column: string; field: string; kind: DetailFieldKind };

/**
 * One CSV column per Property.details field actually defined in
 * lib/admin/property-details-schema.ts — never invented. A column can be
 * shared by two groups when the underlying field means the same thing (e.g.
 * `d_piscine` = "pool" on both villa/riad and hotel schemas); only the
 * columns matching the row's own type_bien group are ever read — the rest
 * stay unused on that row (phase 6J2 §4: "les champs non fournis restent vides").
 */
export const DETAILS_COLUMNS_BY_GROUP: Record<PropertyTypeGroup, DetailColumnConfig[]> = {
  "villa-maison-riad": [
    { column: "d_piscine", field: "pool", kind: "bool" },
    { column: "d_jardin", field: "garden", kind: "bool" },
    { column: "d_dependances", field: "outbuildings", kind: "bool" },
    { column: "d_rooftop", field: "rooftop", kind: "bool" },
    { column: "d_vue", field: "view", kind: "raw" },
    { column: "d_cheminee", field: "fireplace", kind: "bool" },
    { column: "d_hammam", field: "hammam", kind: "bool" },
  ],
  "appartement-duplex-penthouse": [
    { column: "d_nom_residence", field: "residenceName", kind: "raw" },
    { column: "d_ascenseur", field: "elevator", kind: "bool" },
    { column: "d_position_etage", field: "floorPosition", kind: "raw" },
    { column: "d_terrasse_appt", field: "terrace", kind: "bool" },
    { column: "d_concierge", field: "concierge", kind: "bool" },
    { column: "d_parking_inclus", field: "parkingIncluded", kind: "bool" },
  ],
  terrain: [
    { column: "d_zonage", field: "zoning", kind: "raw" },
    { column: "d_facade_metres", field: "frontageMeters", kind: "raw" },
    { column: "d_constructible", field: "buildable", kind: "bool" },
    { column: "d_type_titre", field: "titleDeed", kind: "raw" },
    { column: "d_viabilise", field: "utilitiesConnected", kind: "bool" },
    { column: "d_pente_pourcent", field: "slopePercent", kind: "raw" },
    { column: "d_vue", field: "view", kind: "raw" },
  ],
  "hotel-maison-hotes": [
    { column: "d_nombre_chambres_hotel", field: "roomsCount", kind: "raw" },
    { column: "d_capacite_personnes", field: "capacityGuests", kind: "raw" },
    { column: "d_type_licence", field: "licenseType", kind: "raw" },
    { column: "d_restaurant_sur_place", field: "restaurantOnSite", kind: "bool" },
    { column: "d_spa", field: "spa", kind: "bool" },
    { column: "d_piscine", field: "pool", kind: "bool" },
    { column: "d_taux_occupation_pourcent", field: "occupancyRatePercent", kind: "raw" },
    { column: "d_revenu_indicatif", field: "indicativeRevenueInternal", kind: "raw" },
  ],
  "commerce-bureau-depot": [
    { column: "d_type_activite", field: "activityType", kind: "raw" },
    { column: "d_surface_vente", field: "salesAreaSqm", kind: "raw" },
    { column: "d_surface_stockage", field: "storageAreaSqm", kind: "raw" },
    { column: "d_type_bail", field: "leaseType", kind: "raw" },
    { column: "d_loyer_mensuel", field: "monthlyLeaseRent", kind: "raw" },
    { column: "d_frequentation", field: "footTraffic", kind: "raw" },
    { column: "d_licence", field: "license", kind: "raw" },
    { column: "d_openspace", field: "openSpace", kind: "bool" },
    { column: "d_salles_reunion", field: "meetingRooms", kind: "raw" },
    { column: "d_quai_chargement", field: "loadingDock", kind: "bool" },
    { column: "d_hauteur_plafond", field: "ceilingHeightMeters", kind: "raw" },
    { column: "d_securite", field: "security", kind: "raw" },
    { column: "d_acces_camion", field: "truckAccess", kind: "bool" },
  ],
  "programme-neuf": [
    { column: "d_promoteur", field: "developerNameTemp", kind: "raw" },
    { column: "d_nom_programme", field: "programName", kind: "raw" },
    { column: "d_phase", field: "phase", kind: "raw" },
    { column: "d_date_livraison", field: "deliveryDate", kind: "raw" },
    { column: "d_typologie", field: "typology", kind: "raw" },
    { column: "d_numero_lot", field: "lotNumber", kind: "raw" },
    { column: "d_lots_disponibles", field: "unitsAvailable", kind: "raw" },
  ],
};

function uniqueDetailsColumns(): string[] {
  const seen = new Set<string>();
  const columns: string[] = [];
  for (const group of Object.keys(DETAILS_COLUMNS_BY_GROUP) as PropertyTypeGroup[]) {
    for (const { column } of DETAILS_COLUMNS_BY_GROUP[group]) {
      if (!seen.has(column)) {
        seen.add(column);
        columns.push(column);
      }
    }
  }
  return columns;
}

export const IMPORT_CSV_COLUMNS = [
  ...CORE_COLUMNS,
  ...LOCATION_COLUMNS,
  ...COMMERCIAL_COLUMNS,
  ...SURFACE_COLUMNS,
  ...ROOM_COLUMNS,
  ...CONDITION_COLUMNS,
  ...MARKETING_COLUMNS,
  ...CONTENT_COLUMNS,
  ...STATUS_COLUMNS,
  ...IMAGE_COLUMNS,
  ...uniqueDetailsColumns(),
] as const;

/** Only these must actually be present as a header — everything else in IMPORT_CSV_COLUMNS may be entirely absent from a given file (treated as blank on every row). */
export const REQUIRED_IMPORT_COLUMNS = ["source_external_id", "titre", "transaction", "type_bien", "ville"] as const;

export const MAX_IMPORT_ROWS = 500;
export const MAX_IMAGE_URLS_PER_ROW = 30;

export type ValidatedImportRow = {
  sourceExternalId: string;
  titleFr: string;
  transaction: DbTransaction;
  propertyType: DbPropertyType;
  propertySubtype: string | null;

  city: string;
  district: string | null;
  addressPublic: string | null;
  latitude: number | null;
  longitude: number | null;
  hasValidCoordinates: boolean;
  proximityNotes: string | null;

  price: number | null;
  currency: string;
  priceOnRequest: boolean;
  pricePerSqm: number | null;
  negotiable: boolean;
  agencyFeePercent: number | null;
  estimatedYieldPercent: number | null;

  livingArea: number | null;
  landArea: number | null;
  builtArea: number | null;
  terraceArea: number | null;
  balconyArea: number | null;
  basementArea: number | null;

  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  salons: number | null;
  kitchens: number | null;
  parkingSpaces: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;

  condition: DbPropertyCondition | null;
  furnished: DbFurnishedState | null;
  orientation: DbOrientation | null;
  availability: DbAvailability | null;

  isFeatured: boolean;
  isGoodDeal: boolean;
  isCoupDeCoeur: boolean;
  isExclusive: boolean;

  shortDescription: string | null;
  descriptionFr: string | null;
  tagSlugs: string[];

  status: DbPropertyStatus;
  visibility: DbVisibility;

  imageUrls: string[];

  details: PropertyDetailsInput;
};

export type ImportRowValidation = { ok: true; data: ValidatedImportRow } | { ok: false; errors: string[] };

/** Every active tag's slug, keyed by its own normalized slug AND its normalized French label — built once per batch. */
export type TagLookup = Map<string, string>;

export function buildTagLookup(tags: { slug: string; labelFr: string }[]): TagLookup {
  const lookup: TagLookup = new Map();
  for (const tag of tags) {
    lookup.set(slugify(tag.slug), tag.slug);
    lookup.set(slugify(tag.labelFr), tag.slug);
  }
  return lookup;
}

function buildEnumLookup<T extends string>(values: readonly T[], labels: Record<T, string>): Map<string, T> {
  const map = new Map<string, T>();
  for (const value of values) {
    map.set(slugify(value), value);
    map.set(slugify(labels[value]), value);
  }
  return map;
}

const transactionLookup = buildEnumLookup(transactionValues, transactionLabels);
const propertyTypeLookup = buildEnumLookup(propertyTypeValues, propertyTypeLabels);
const statusLookup = buildEnumLookup(propertyStatusValues, propertyStatusLabels);
const furnishedLookup = buildEnumLookup(furnishedValues, furnishedLabels);
const conditionLookup = buildEnumLookup(conditionValues, conditionLabels);
const orientationLookup = buildEnumLookup(orientationValues, orientationLabels);
const availabilityLookup = buildEnumLookup(availabilityValues, availabilityLabels);
const visibilityLookup = new Map<string, DbVisibility>();
for (const value of visibilityValues) {
  visibilityLookup.set(slugify(value), value);
  visibilityLookup.set(slugify(visibilityLabels[value]), value);
}

/** undefined = absent, null = present but invalid, number = parsed value. Accepts "," as the decimal separator. */
function parseOptionalNumber(raw: string): number | null | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const normalized = trimmed.replace(/\s/g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** undefined = absent (defaults to false by caller), null = present but unrecognized. */
function parseOptionalBoolean(raw: string): boolean | null | undefined {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "") return undefined;
  if (["oui", "vrai", "true", "1", "yes"].includes(trimmed)) return true;
  if (["non", "faux", "false", "0", "no"].includes(trimmed)) return false;
  return null;
}

function resolveEnum<T extends string>(raw: string, lookup: Map<string, T>): T | null | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const resolved = lookup.get(slugify(trimmed));
  return resolved ?? null;
}

function readColumn(raw: Record<string, string>, column: string): string {
  return raw[column] ?? "";
}

/** Reused for every 0-100 percent field (frais_agence, rendement_estime). */
function validatePercent(raw: string, label: string, errors: string[]): number | null {
  const value = parseOptionalNumber(raw);
  if (value === null) {
    errors.push(`${label} invalide : "${raw}".`);
    return null;
  }
  if (value === undefined) return null;
  if (value < 0 || value > 100) {
    errors.push(`${label} doit être compris entre 0 et 100.`);
    return null;
  }
  return value;
}

/** Reused for every plain positive-area/measurement field. */
function validatePositive(raw: string, label: string, errors: string[]): number | null {
  const value = parseOptionalNumber(raw);
  if (value === null) {
    errors.push(`${label} invalide : "${raw}".`);
    return null;
  }
  if (value === undefined) return null;
  if (value <= 0) {
    errors.push(`${label} doit être supérieur à 0.`);
    return null;
  }
  return value;
}

/** Reused for every non-negative integer count field. */
function validateNonNegativeInt(raw: string, label: string, errors: string[]): number | null {
  const value = parseOptionalNumber(raw);
  if (value === undefined) return null;
  if (value === null || !Number.isInteger(value) || value < 0) {
    errors.push(`${label} invalide : "${raw}".`);
    return null;
  }
  return value;
}

function buildDetailsInput(
  group: PropertyTypeGroup,
  raw: Record<string, string>
): { ok: true; data: PropertyDetailsInput } | { ok: false; errors: string[] } {
  const config = DETAILS_COLUMNS_BY_GROUP[group];
  const input: Record<string, unknown> = { kind: group };
  const errors: string[] = [];

  for (const { column, field, kind } of config) {
    const value = readColumn(raw, column);
    if (kind === "bool") {
      const parsed = parseOptionalBoolean(value);
      if (parsed === null) {
        errors.push(`${column} invalide : "${value}".`);
        continue;
      }
      input[field] = parsed === true;
    } else {
      input[field] = value;
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const parsed = detailsSchemaForGroup(group).safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".") || "details"} : ${issue.message}`),
    };
  }
  return { ok: true, data: parsed.data };
}

/**
 * Validates one CSV row against the pilot import contract. Collects every
 * error found (not just the first) so the review screen can show a complete
 * picture per line. Never returns partial/best-effort data: either every
 * field is valid, or nothing is imported for this row. `image_urls` is
 * intentionally NOT validated here (no network calls at preview time) —
 * only parsed into a deduplicated list; the actual download/rejection
 * happens in step B (see lib/admin/import-image-import.ts).
 */
export function validateImportRow(raw: Record<string, string>, tagLookup: TagLookup): ImportRowValidation {
  const errors: string[] = [];

  const sourceExternalId = readColumn(raw, "source_external_id").trim();
  if (!sourceExternalId) errors.push("source_external_id manquant.");
  else if (sourceExternalId.length > 190) errors.push("source_external_id trop long (190 caractères max).");

  const titleFr = readColumn(raw, "titre").trim();
  if (!titleFr) errors.push("titre manquant.");
  else if (titleFr.length > 200) errors.push("titre trop long (200 caractères max).");

  const transaction = resolveEnum<TransactionType>(readColumn(raw, "transaction"), transactionLookup);
  if (transaction === undefined) errors.push("transaction manquante.");
  else if (transaction === null) errors.push(`transaction invalide : "${raw.transaction}".`);

  const propertyType = resolveEnum<PropertyType>(readColumn(raw, "type_bien"), propertyTypeLookup);
  if (propertyType === undefined) errors.push("type_bien manquant.");
  else if (propertyType === null) errors.push(`type_bien invalide : "${raw.type_bien}".`);

  let propertySubtype: string | null = null;
  const rawSubtype = readColumn(raw, "sous_type").trim();
  if (rawSubtype && propertyType) {
    if (isValidSubtype(propertyType, rawSubtype)) propertySubtype = rawSubtype;
    else errors.push(`sous_type "${rawSubtype}" invalide pour le type_bien "${raw.type_bien}".`);
  }

  const city = readColumn(raw, "ville").trim();
  if (!city) errors.push("ville manquante.");
  else if (city.length > 120) errors.push("ville trop longue (120 caractères max).");

  const district = readColumn(raw, "quartier").trim() || null;
  if (district && district.length > 120) errors.push("quartier trop long (120 caractères max).");

  const addressPublic = readColumn(raw, "adresse_publique").trim() || null;
  if (addressPublic && addressPublic.length > 240) errors.push("adresse_publique trop longue (240 caractères max).");

  const latitude = parseOptionalNumber(readColumn(raw, "latitude"));
  if (latitude === null) errors.push(`latitude invalide : "${raw.latitude}".`);
  else if (typeof latitude === "number" && (latitude < -90 || latitude > 90)) errors.push("latitude hors limites (-90 à 90).");

  const longitude = parseOptionalNumber(readColumn(raw, "longitude"));
  if (longitude === null) errors.push(`longitude invalide : "${raw.longitude}".`);
  else if (typeof longitude === "number" && (longitude < -180 || longitude > 180)) errors.push("longitude hors limites (-180 à 180).");

  const rayonProximite = validatePositive(readColumn(raw, "rayon_proximite"), "rayon_proximite", errors);

  const priceOnRequest = parseOptionalBoolean(readColumn(raw, "prix_sur_demande"));
  if (priceOnRequest === null) errors.push(`prix_sur_demande invalide : "${raw.prix_sur_demande}".`);

  const price = parseOptionalNumber(readColumn(raw, "prix_mad"));
  if (price === null) errors.push(`prix_mad invalide : "${raw.prix_mad}".`);
  else if (typeof price === "number" && price <= 0) errors.push("prix_mad doit être supérieur à 0.");
  if (price === undefined && priceOnRequest !== true) errors.push("prix_mad manquant (requis sauf si prix_sur_demande = oui).");

  const devise = readColumn(raw, "devise").trim();
  if (devise && devise.length > 8) errors.push("devise trop longue (8 caractères max).");
  const currency = devise ? devise.toUpperCase() : "MAD";

  const pricePerSqm = validatePositive(readColumn(raw, "prix_m2"), "prix_m2", errors);

  const negotiable = parseOptionalBoolean(readColumn(raw, "negociable"));
  if (negotiable === null) errors.push(`negociable invalide : "${raw.negociable}".`);

  const agencyFeePercent = validatePercent(readColumn(raw, "frais_agence"), "frais_agence", errors);
  const estimatedYieldPercent = validatePercent(readColumn(raw, "rendement_estime"), "rendement_estime", errors);

  const livingArea = validatePositive(readColumn(raw, "surface_habitable"), "surface_habitable", errors);
  const landArea = validatePositive(readColumn(raw, "surface_terrain"), "surface_terrain", errors);
  const builtArea = validatePositive(readColumn(raw, "surface_construite"), "surface_construite", errors);
  const terraceArea = validatePositive(readColumn(raw, "terrasse"), "terrasse", errors);
  const balconyArea = validatePositive(readColumn(raw, "balcon"), "balcon", errors);
  const basementArea = validatePositive(readColumn(raw, "sous_sol"), "sous_sol", errors);

  const bedrooms = validateNonNegativeInt(readColumn(raw, "chambres"), "chambres", errors);
  const suites = validateNonNegativeInt(readColumn(raw, "suites"), "suites", errors);
  const bathrooms = validateNonNegativeInt(readColumn(raw, "salles_de_bain"), "salles_de_bain", errors);
  const salons = validateNonNegativeInt(readColumn(raw, "salons"), "salons", errors);
  const kitchens = validateNonNegativeInt(readColumn(raw, "cuisines"), "cuisines", errors);
  const parkingSpaces = validateNonNegativeInt(readColumn(raw, "parking"), "parking", errors);
  const totalFloors = validateNonNegativeInt(readColumn(raw, "etages"), "etages", errors);

  const yearBuiltRaw = parseOptionalNumber(readColumn(raw, "annee_construction"));
  let yearBuilt: number | null = null;
  if (yearBuiltRaw === null) errors.push(`annee_construction invalide : "${raw.annee_construction}".`);
  else if (typeof yearBuiltRaw === "number") {
    if (!Number.isInteger(yearBuiltRaw) || yearBuiltRaw < 1900 || yearBuiltRaw > currentYear + 3) {
      errors.push(`annee_construction doit être comprise entre 1900 et ${currentYear + 3}.`);
    } else {
      yearBuilt = yearBuiltRaw;
    }
  }

  const conditionValue = resolveEnum<PropertyCondition>(readColumn(raw, "etat"), conditionLookup);
  if (conditionValue === null) errors.push(`etat invalide : "${raw.etat}".`);

  const furnishedValue = resolveEnum<FurnishedState>(readColumn(raw, "meuble"), furnishedLookup);
  if (furnishedValue === null) errors.push(`meuble invalide : "${raw.meuble}".`);

  const orientationValue = resolveEnum<Orientation>(readColumn(raw, "orientation"), orientationLookup);
  if (orientationValue === null) errors.push(`orientation invalide : "${raw.orientation}".`);

  const availabilityValue = resolveEnum<Availability>(readColumn(raw, "disponibilite"), availabilityLookup);
  if (availabilityValue === null) errors.push(`disponibilite invalide : "${raw.disponibilite}".`);

  const isFeatured = parseOptionalBoolean(readColumn(raw, "a_la_une"));
  if (isFeatured === null) errors.push(`a_la_une invalide : "${raw.a_la_une}".`);

  const isGoodDeal = parseOptionalBoolean(readColumn(raw, "bonne_affaire"));
  if (isGoodDeal === null) errors.push(`bonne_affaire invalide : "${raw.bonne_affaire}".`);

  const isCoupDeCoeur = parseOptionalBoolean(readColumn(raw, "coup_de_coeur"));
  if (isCoupDeCoeur === null) errors.push(`coup_de_coeur invalide : "${raw.coup_de_coeur}".`);

  const isExclusive = parseOptionalBoolean(readColumn(raw, "exclusif"));
  if (isExclusive === null) errors.push(`exclusif invalide : "${raw.exclusif}".`);

  const shortDescription = readColumn(raw, "description_courte").trim() || null;
  if (shortDescription && shortDescription.length > 240) errors.push("description_courte trop longue (240 caractères max).");

  const descriptionFr = readColumn(raw, "description_complete").trim() || null;
  if (descriptionFr && descriptionFr.length > 4000) errors.push("description_complete trop longue (4000 caractères max).");

  const statusRaw = readColumn(raw, "statut").trim();
  const status = statusRaw === "" ? "disponible" : resolveEnum<PropertyBusinessStatus>(raw.statut, statusLookup);
  if (status === null) errors.push(`statut invalide : "${raw.statut}".`);

  const visibilityRaw = readColumn(raw, "visibilite").trim();
  const visibility = visibilityRaw === "" ? "PUBLIC" : resolveEnum<DbVisibility>(raw.visibilite, visibilityLookup);
  if (visibility === null) errors.push(`visibilite invalide : "${raw.visibilite}".`);

  const tagSlugs: string[] = [];
  const unknownTags: string[] = [];
  const rawTags = readColumn(raw, "tags")
    .split("|")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  for (const rawTag of rawTags) {
    const resolved = tagLookup.get(slugify(rawTag));
    if (resolved) {
      if (!tagSlugs.includes(resolved)) tagSlugs.push(resolved);
    } else {
      unknownTags.push(rawTag);
    }
  }
  if (unknownTags.length > 0) errors.push(`tags inconnus : ${unknownTags.join(", ")}.`);

  const imageUrls: string[] = [];
  for (const url of readColumn(raw, "image_urls")
    .split("|")
    .map((u) => u.trim())
    .filter((u) => u.length > 0)) {
    if (!imageUrls.includes(url)) imageUrls.push(url);
  }

  let details: PropertyDetailsInput | undefined;
  if (propertyType) {
    const group = propertyTypeGroup[propertyType];
    const detailsResult = buildDetailsInput(group, raw);
    if (!detailsResult.ok) errors.push(...detailsResult.errors);
    else details = detailsResult.data;
  }

  if (errors.length > 0) return { ok: false, errors };

  const hasValidCoordinates = typeof latitude === "number" && typeof longitude === "number";
  const proximityNotes = typeof rayonProximite === "number" ? `Rayon de proximité renseigné : ${rayonProximite} km` : null;

  // At this point every field above is guaranteed valid — the casts below
  // just narrow away the null/undefined branches TypeScript can't rule out.
  return {
    ok: true,
    data: {
      sourceExternalId,
      titleFr,
      transaction: transactionToDb[transaction as TransactionType],
      propertyType: propertyTypeToDb[propertyType as PropertyType],
      propertySubtype,

      city,
      district,
      addressPublic,
      latitude: (latitude as number | undefined) ?? null,
      longitude: (longitude as number | undefined) ?? null,
      hasValidCoordinates,
      proximityNotes,

      price: (price as number | undefined) ?? null,
      currency,
      priceOnRequest: priceOnRequest === true,
      pricePerSqm,
      negotiable: negotiable === true,
      agencyFeePercent,
      estimatedYieldPercent,

      livingArea,
      landArea,
      builtArea,
      terraceArea,
      balconyArea,
      basementArea,

      bedrooms,
      suites,
      bathrooms,
      salons,
      kitchens,
      parkingSpaces,
      totalFloors,
      yearBuilt,

      condition: conditionValue ? conditionToDb[conditionValue] : null,
      furnished: furnishedValue ? furnishedToDb[furnishedValue] : null,
      orientation: orientationValue ? orientationToDb[orientationValue] : null,
      availability: availabilityValue ? availabilityToDb[availabilityValue] : null,

      isFeatured: isFeatured === true,
      isGoodDeal: isGoodDeal === true,
      isCoupDeCoeur: isCoupDeCoeur === true,
      isExclusive: isExclusive === true,

      shortDescription,
      descriptionFr,
      tagSlugs,

      status: propertyStatusToDb[status as PropertyBusinessStatus],
      visibility: visibility as DbVisibility,

      imageUrls,

      details: details as PropertyDetailsInput,
    },
  };
}
