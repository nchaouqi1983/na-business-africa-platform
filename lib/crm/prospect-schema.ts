import * as z from "zod";
import {
  prospectTypeValues,
  prospectLanguageValues,
  prospectSourceValues,
  prospectStatusValues,
  interestLevelValues,
} from "@/lib/crm/enum-labels";
import { partyKindValues } from "@/lib/real-estate-network/enum-labels";
import { optionalString, optionalPositiveNumber, emptyToUndefined } from "@/lib/admin/zod-helpers";
// Imported from the standalone enums module, not "@/lib/generated/prisma/client" —
// see the comment at the top of lib/admin/property-enum-maps.ts. This schema
// is used by a "use client" form component, and the full client entrypoint
// is Node-only.
import { PropertyType as DbPropertyType, PropertyTransaction as DbTransaction } from "@/lib/generated/prisma/enums";

const propertyTypeValues = Object.values(DbPropertyType) as [string, ...string[]];
const transactionValues = Object.values(DbTransaction) as [string, ...string[]];

/** "Casablanca, Rabat, Marrakech" free-text input -> trimmed, deduplicated string array. */
function splitList(value: unknown): string[] {
  if (typeof value !== "string") return [];
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

export const prospectFormSchema = z
  .object({
    type: z.enum(prospectTypeValues, { error: "Type de prospect invalide." }),
    kind: z.enum(partyKindValues, { error: "Type invalide." }).default("PHYSIQUE"),
    firstName: optionalString(100),
    lastName: optionalString(100),
    companyName: optionalString(200),
    phone: z.string().trim().min(1, { error: "Téléphone requis." }).max(30),
    email: z.preprocess(emptyToUndefined, z.string().trim().email({ error: "E-mail invalide." }).max(200).optional()),
    preferredLanguage: z.enum(prospectLanguageValues, { error: "Langue invalide." }).default("FR"),
    source: z.enum(prospectSourceValues, { error: "Source invalide." }).default("AUTRE"),
    status: z.enum(prospectStatusValues, { error: "Statut invalide." }).default("NOUVEAU"),
    searchCities: z.preprocess(splitList, z.array(z.string().max(100)).max(20)),
    searchDistricts: z.preprocess(splitList, z.array(z.string().max(100)).max(20)),
    searchPropertyTypes: z.array(z.enum(propertyTypeValues)).default([]),
    searchTransaction: z.preprocess(emptyToUndefined, z.enum(transactionValues).optional()),
    budgetMin: optionalPositiveNumber,
    budgetMax: optionalPositiveNumber,
    currency: z.string().trim().min(1).max(10).default("MAD"),
    projectTimeline: optionalString(200),
    internalNotes: optionalString(4000),
    assignedToId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "PHYSIQUE" && !data.lastName?.trim()) {
      ctx.addIssue({ code: "custom", path: ["lastName"], message: "Nom requis pour une personne physique." });
    }
    if (data.kind === "SOCIETE" && !data.companyName?.trim()) {
      ctx.addIssue({ code: "custom", path: ["companyName"], message: "Nom de société requis." });
    }
    if (data.budgetMin !== undefined && data.budgetMax !== undefined && data.budgetMin > data.budgetMax) {
      ctx.addIssue({ code: "custom", path: ["budgetMax"], message: "Le budget max doit être supérieur au budget min." });
    }
  });

export type ProspectFormInput = z.infer<typeof prospectFormSchema>;

export function parseProspectForm(formData: FormData) {
  return prospectFormSchema.safeParse({
    type: formData.get("type"),
    kind: formData.get("kind"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    companyName: formData.get("companyName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    preferredLanguage: formData.get("preferredLanguage"),
    source: formData.get("source"),
    status: formData.get("status"),
    searchCities: formData.get("searchCities"),
    searchDistricts: formData.get("searchDistricts"),
    searchPropertyTypes: formData.getAll("searchPropertyTypes"),
    searchTransaction: formData.get("searchTransaction"),
    budgetMin: formData.get("budgetMin"),
    budgetMax: formData.get("budgetMax"),
    currency: formData.get("currency"),
    projectTimeline: formData.get("projectTimeline"),
    internalNotes: formData.get("internalNotes"),
    assignedToId: formData.get("assignedToId"),
  });
}

/** Prospect status change from the 360° screen's status dropdown. */
export const prospectStatusFormSchema = z.object({
  status: z.enum(prospectStatusValues, { error: "Statut invalide." }),
});

export function parseProspectStatusForm(formData: FormData) {
  return prospectStatusFormSchema.safeParse({ status: formData.get("status") });
}

/** Add/update a bien d'intérêt from the prospect's 360° screen. */
export const propertyInterestFormSchema = z.object({
  propertyId: z.string().trim().min(1, { error: "Bien requis." }),
  interestLevel: z.enum(interestLevelValues, { error: "Niveau d'intérêt invalide." }).default("A_SUIVRE"),
  internalNote: optionalString(1000),
});

export function parsePropertyInterestForm(formData: FormData) {
  return propertyInterestFormSchema.safeParse({
    propertyId: formData.get("propertyId"),
    interestLevel: formData.get("interestLevel"),
    internalNote: formData.get("internalNote"),
  });
}
