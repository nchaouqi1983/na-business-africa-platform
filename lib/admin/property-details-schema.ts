import * as z from "zod";
import type { PropertyTypeGroup } from "@/lib/property-schema";
import {
  emptyToUndefined,
  optionalString,
  optionalPositiveNumber,
  optionalNonNegativeInt,
  checkboxBoolean,
} from "@/lib/admin/zod-helpers";

function optionalEnum<T extends [string, ...string[]]>(values: T) {
  return z.preprocess(emptyToUndefined, z.enum(values).optional());
}

/**
 * Champs conditionnels très spécifiques par type, stockés dans Property.details
 * (JSON). Une union discriminée par `kind` — calquée sur PropertyTypeGroup de
 * lib/property-schema.ts — pour rester typée et validée sans jamais utiliser
 * `any`. Le `kind` est toujours dérivé côté serveur du propertyType soumis,
 * jamais accepté tel quel depuis le client.
 */

export const villaMaisonRiadDetailsSchema = z.object({
  kind: z.literal("villa-maison-riad"),
  pool: checkboxBoolean,
  garden: checkboxBoolean,
  outbuildings: checkboxBoolean,
  rooftop: checkboxBoolean,
  view: optionalString(120),
  fireplace: checkboxBoolean,
  hammam: checkboxBoolean,
});

export const appartementDetailsSchema = z.object({
  kind: z.literal("appartement-duplex-penthouse"),
  residenceName: optionalString(120),
  elevator: checkboxBoolean,
  floorPosition: optionalEnum(["rdc", "intermediaire", "dernier-etage"]),
  terrace: checkboxBoolean,
  concierge: checkboxBoolean,
  parkingIncluded: checkboxBoolean,
});

export const terrainDetailsSchema = z.object({
  kind: z.literal("terrain"),
  zoning: optionalString(120),
  frontageMeters: optionalPositiveNumber,
  buildable: checkboxBoolean,
  titleDeed: optionalEnum(["titre-foncier", "melkia", "requisition-immatriculation"]),
  utilitiesConnected: checkboxBoolean,
  slopePercent: optionalPositiveNumber,
  view: optionalString(120),
});

export const hotelDetailsSchema = z.object({
  kind: z.literal("hotel-maison-hotes"),
  roomsCount: optionalNonNegativeInt,
  capacityGuests: optionalNonNegativeInt,
  licenseType: optionalString(120),
  restaurantOnSite: checkboxBoolean,
  spa: checkboxBoolean,
  pool: checkboxBoolean,
  occupancyRatePercent: optionalPositiveNumber,
  indicativeRevenueInternal: optionalPositiveNumber,
});

export const commerceDetailsSchema = z.object({
  kind: z.literal("commerce-bureau-depot"),
  activityType: optionalString(120),
  salesAreaSqm: optionalPositiveNumber,
  storageAreaSqm: optionalPositiveNumber,
  leaseType: optionalString(120),
  monthlyLeaseRent: optionalPositiveNumber,
  footTraffic: optionalEnum(["faible", "moyen", "eleve"]),
  license: optionalString(120),
  openSpace: checkboxBoolean,
  meetingRooms: optionalNonNegativeInt,
  loadingDock: checkboxBoolean,
  ceilingHeightMeters: optionalPositiveNumber,
  security: optionalString(120),
  truckAccess: checkboxBoolean,
});

export const programmeNeufDetailsSchema = z.object({
  kind: z.literal("programme-neuf"),
  developerNameTemp: optionalString(160),
  programName: optionalString(160),
  phase: optionalString(80),
  deliveryDate: optionalString(40),
  typology: optionalString(120),
  lotNumber: optionalString(60),
  unitsAvailable: optionalNonNegativeInt,
});

export const propertyDetailsSchema = z.discriminatedUnion("kind", [
  villaMaisonRiadDetailsSchema,
  appartementDetailsSchema,
  terrainDetailsSchema,
  hotelDetailsSchema,
  commerceDetailsSchema,
  programmeNeufDetailsSchema,
]);

export type PropertyDetailsInput = z.infer<typeof propertyDetailsSchema>;

const detailsSchemaByGroup = {
  "villa-maison-riad": villaMaisonRiadDetailsSchema,
  "appartement-duplex-penthouse": appartementDetailsSchema,
  terrain: terrainDetailsSchema,
  "hotel-maison-hotes": hotelDetailsSchema,
  "commerce-bureau-depot": commerceDetailsSchema,
  "programme-neuf": programmeNeufDetailsSchema,
} as const satisfies Record<PropertyTypeGroup, z.ZodTypeAny>;

export function detailsSchemaForGroup(group: PropertyTypeGroup) {
  return detailsSchemaByGroup[group];
}

/** Extracts the `details.<field>` entries relevant to one group from a FormData. */
export function extractDetailsFormValues(formData: FormData, group: PropertyTypeGroup): Record<string, unknown> {
  const schema = detailsSchemaByGroup[group];
  const keys = Object.keys(schema.shape).filter((key) => key !== "kind");
  const values: Record<string, unknown> = {};
  for (const key of keys) {
    values[key] = formData.get(`details.${key}`);
  }
  return values;
}

/**
 * Safely re-parses a stored `Property.details` JSON value for a given group,
 * to pre-fill the conditional fieldset. Falls back to that group's empty
 * shape when the stored value is missing, from a previous group (the type
 * changed since), or otherwise doesn't validate.
 */
export function parseStoredDetails(value: unknown, group: PropertyTypeGroup): PropertyDetailsInput {
  const schema = detailsSchemaByGroup[group];
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  return schema.parse({ kind: group });
}
