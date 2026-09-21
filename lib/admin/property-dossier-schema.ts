import * as z from "zod";
import {
  transactionValues,
  propertyTypeValues,
  furnishedValues,
  conditionValues,
  orientationValues,
} from "@/lib/property-schema";
import { propertyStatusValues, visibilityValues, isValidSubtype } from "@/lib/admin/property-enum-maps";
import {
  optionalString,
  optionalPositiveNumber,
  optionalNonNegativeInt,
  optionalIntInRange,
  optionalPercent,
  optionalNumberInRange,
  checkboxBoolean,
} from "@/lib/admin/zod-helpers";

const currentYear = new Date().getFullYear();

/**
 * Le dossier complet du bien — hors `details` (union discriminée résolue à
 * part côté serveur, voir property-details-schema.ts), hors tags (traités
 * séparément car ils exigent une vérification en base) et hors données
 * privées (formulaire et Server Action distincts, réservés SUPER_ADMIN/ADMIN).
 */
export const propertyDossierSchema = z
  .object({
    // Identité & publication
    titleFr: z.string().trim().min(1, { error: "Titre requis." }).max(200),
    shortDescription: optionalString(240),
    descriptionFr: optionalString(4000),
    transaction: z.enum(transactionValues, { error: "Transaction invalide." }),
    propertyType: z.enum(propertyTypeValues, { error: "Type de bien invalide." }),
    propertySubtype: optionalString(80),
    status: z.enum(propertyStatusValues, { error: "Statut invalide." }).default("disponible"),
    visibility: z.enum(visibilityValues, { error: "Visibilité invalide." }).default("PUBLIC"),
    isFeatured: checkboxBoolean,
    isGoodDeal: checkboxBoolean,
    isCoupDeCoeur: checkboxBoolean,
    /** Only ever applied server-side when the actor is SUPER_ADMIN/ADMIN — see property-actions.ts. */
    assignedToId: optionalString(64),

    // Localisation & carte
    city: z.string().trim().min(1, { error: "Ville requise." }).max(120),
    district: optionalString(120),
    addressPublic: optionalString(240),
    latitude: optionalNumberInRange(-90, 90),
    longitude: optionalNumberInRange(-180, 180),
    proximityNotes: optionalString(600),

    // Prix & commercialisation
    price: optionalPositiveNumber,
    priceOnRequest: checkboxBoolean,
    pricePerSqm: optionalPositiveNumber,
    negotiable: checkboxBoolean,
    agencyFeePercent: optionalPercent,
    monthlyCharges: optionalPositiveNumber,
    securityDeposit: optionalPositiveNumber,
    estimatedYieldPercent: optionalPercent,
    isCreditEligible: checkboxBoolean,
    isMourabahaEligible: checkboxBoolean,

    // Surfaces & pièces
    livingArea: optionalPositiveNumber,
    builtArea: optionalPositiveNumber,
    landArea: optionalPositiveNumber,
    terraceArea: optionalPositiveNumber,
    balconyArea: optionalPositiveNumber,
    basementArea: optionalPositiveNumber,
    bedrooms: optionalNonNegativeInt,
    suites: optionalNonNegativeInt,
    bathrooms: optionalNonNegativeInt,
    salons: optionalNonNegativeInt,
    kitchens: optionalNonNegativeInt,
    parkingSpaces: optionalNonNegativeInt,
    floor: optionalNonNegativeInt,
    totalFloors: optionalNonNegativeInt,
    yearBuilt: optionalIntInRange(1900, currentYear + 3),
    condition: z.preprocess(
      (v) => (v === null || v === "" ? undefined : v),
      z.enum(conditionValues, { error: "État invalide." }).optional()
    ),
    furnished: z.preprocess(
      (v) => (v === null || v === "" ? undefined : v),
      z.enum(furnishedValues, { error: "Ameublement invalide." }).optional()
    ),
    orientation: z.preprocess(
      (v) => (v === null || v === "" ? undefined : v),
      z.enum(orientationValues, { error: "Orientation invalide." }).optional()
    ),
  })
  .superRefine((data, ctx) => {
    if (data.propertySubtype && !isValidSubtype(data.propertyType, data.propertySubtype)) {
      ctx.addIssue({
        code: "custom",
        path: ["propertySubtype"],
        message: "Sous-type incompatible avec le type de bien sélectionné.",
      });
    }
  });

export type PropertyDossierInput = z.infer<typeof propertyDossierSchema>;

export function parsePropertyDossierForm(formData: FormData) {
  return propertyDossierSchema.safeParse({
    titleFr: formData.get("titleFr"),
    shortDescription: formData.get("shortDescription"),
    descriptionFr: formData.get("descriptionFr"),
    transaction: formData.get("transaction"),
    propertyType: formData.get("propertyType"),
    propertySubtype: formData.get("propertySubtype"),
    status: formData.get("status"),
    visibility: formData.get("visibility"),
    isFeatured: formData.get("isFeatured"),
    isGoodDeal: formData.get("isGoodDeal"),
    isCoupDeCoeur: formData.get("isCoupDeCoeur"),
    assignedToId: formData.get("assignedToId"),

    city: formData.get("city"),
    district: formData.get("district"),
    addressPublic: formData.get("addressPublic"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    proximityNotes: formData.get("proximityNotes"),

    price: formData.get("price"),
    priceOnRequest: formData.get("priceOnRequest"),
    pricePerSqm: formData.get("pricePerSqm"),
    negotiable: formData.get("negotiable"),
    agencyFeePercent: formData.get("agencyFeePercent"),
    monthlyCharges: formData.get("monthlyCharges"),
    securityDeposit: formData.get("securityDeposit"),
    estimatedYieldPercent: formData.get("estimatedYieldPercent"),
    isCreditEligible: formData.get("isCreditEligible"),
    isMourabahaEligible: formData.get("isMourabahaEligible"),

    livingArea: formData.get("livingArea"),
    builtArea: formData.get("builtArea"),
    landArea: formData.get("landArea"),
    terraceArea: formData.get("terraceArea"),
    balconyArea: formData.get("balconyArea"),
    basementArea: formData.get("basementArea"),
    bedrooms: formData.get("bedrooms"),
    suites: formData.get("suites"),
    bathrooms: formData.get("bathrooms"),
    salons: formData.get("salons"),
    kitchens: formData.get("kitchens"),
    parkingSpaces: formData.get("parkingSpaces"),
    floor: formData.get("floor"),
    totalFloors: formData.get("totalFloors"),
    yearBuilt: formData.get("yearBuilt"),
    condition: formData.get("condition"),
    furnished: formData.get("furnished"),
    orientation: formData.get("orientation"),
  });
}

export const propertyPrivateSchema = z.object({
  privateAddress: optionalString(240),
  ownerName: optionalString(160),
  ownerPhone: optionalString(40),
  ownerEmail: z.preprocess(
    (v) => (v === null || v === "" ? undefined : v),
    z.email({ error: "E-mail invalide." }).optional()
  ),
  mandateReference: optionalString(80),
  mandateStartDate: optionalString(10),
  mandateEndDate: optionalString(10),
  minimumNetPrice: optionalPositiveNumber,
  internalNotes: optionalString(4000),
  source: optionalString(160),
});

export type PropertyPrivateInput = z.infer<typeof propertyPrivateSchema>;

export function parsePropertyPrivateForm(formData: FormData) {
  return propertyPrivateSchema.safeParse({
    privateAddress: formData.get("privateAddress"),
    ownerName: formData.get("ownerName"),
    ownerPhone: formData.get("ownerPhone"),
    ownerEmail: formData.get("ownerEmail"),
    mandateReference: formData.get("mandateReference"),
    mandateStartDate: formData.get("mandateStartDate"),
    mandateEndDate: formData.get("mandateEndDate"),
    minimumNetPrice: formData.get("minimumNetPrice"),
    internalNotes: formData.get("internalNotes"),
    source: formData.get("source"),
  });
}
