import * as z from "zod";
import { emptyToUndefined, optionalString } from "@/lib/admin/zod-helpers";
// Public kebab-case slugs (the vocabulary the /vendre and /off-market
// <select> options actually submit — see lib/properties.ts's
// propertyTypeValues, re-exported from here), never the Prisma enum
// identifiers. lib/admin/property-enum-maps.ts's propertyTypeToDb converts
// this value to the DB enum at the Server Action layer, right before the
// Prisma write — the same split every other public/admin boundary in this
// codebase uses (see lib/crm/prospect-schema.ts for the admin-side one).
import { propertyTypeValues } from "@/lib/property-schema";

/** Shared by every public form: the honeypot must stay empty, the timing field must be present. */
const antiSpamFields = {
  website: optionalString(200),
  formStartedAt: z.string().trim().min(1).max(20),
};

function isHoneypotFilled(website: string | undefined): boolean {
  return Boolean(website && website.trim().length > 0);
}

/** "4000000-7000000" / "10000000-" (open-ended) / "" (no filter) -> {min,max}, same format as components/SearchBar.tsx's budgetRanges. */
function parseBudgetRange(value: unknown): { budgetMin?: number; budgetMax?: number } {
  if (typeof value !== "string" || value.trim() === "") return {};
  const [minRaw, maxRaw] = value.split("-");
  const budgetMin = minRaw ? Number(minRaw) : undefined;
  const budgetMax = maxRaw ? Number(maxRaw) : undefined;
  return {
    budgetMin: Number.isFinite(budgetMin) ? budgetMin : undefined,
    budgetMax: Number.isFinite(budgetMax) ? budgetMax : undefined,
  };
}

/** "4 500 000 MAD" / "4500000" -> 4500000. Free-text price fields are never trusted as structured numbers otherwise. */
function parseFreeTextAmount(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const digitsOnly = value.replace(/[^\d]/g, "");
  if (!digitsOnly) return undefined;
  const amount = Number(digitsOnly);
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
}

/** "Casablanca, Rabat" free-text input -> trimmed, deduplicated string array. Same helper as lib/crm/prospect-schema.ts. */
function splitList(value: unknown): string[] {
  if (typeof value !== "string") return [];
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

// ---------------------------------------------------------------------------
// /contact
// ---------------------------------------------------------------------------

export const contactSubjectValues = ["acheter", "vendre", "investir", "off-market", "autre"] as const;
export type ContactSubjectValue = (typeof contactSubjectValues)[number];

export const contactFormSchema = z.object({
  ...antiSpamFields,
  fullName: z.string().trim().min(1, { error: "Nom complet requis." }).max(200),
  phone: z.string().trim().min(1, { error: "Téléphone requis." }).max(30),
  email: z.string().trim().min(1, { error: "E-mail requis." }).email({ error: "E-mail invalide." }).max(200),
  subject: z.enum(contactSubjectValues, { error: "Sujet invalide." }),
  message: z.string().trim().min(1, { error: "Message requis." }).max(4000),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

export function parseContactForm(formData: FormData) {
  return contactFormSchema.safeParse({
    website: formData.get("website"),
    formStartedAt: formData.get("formStartedAt"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
}

export function isContactHoneypotFilled(formData: FormData): boolean {
  return isHoneypotFilled(String(formData.get("website") ?? ""));
}

// ---------------------------------------------------------------------------
// /vendre
// ---------------------------------------------------------------------------

export const vendreFormSchema = z.object({
  ...antiSpamFields,
  fullName: z.string().trim().min(1, { error: "Nom complet requis." }).max(200),
  phone: z.string().trim().min(1, { error: "Téléphone requis." }).max(30),
  email: z.string().trim().min(1, { error: "E-mail requis." }).email({ error: "E-mail invalide." }).max(200),
  propertyType: z.enum(propertyTypeValues, { error: "Type de bien invalide." }).optional(),
  city: z.string().trim().min(1, { error: "Ville requise." }).max(100),
  district: optionalString(100),
  surface: optionalString(100),
  rooms: optionalString(10),
  priceMode: z.enum(["advice", "amount"]).default("advice"),
  desiredPrice: optionalString(100),
  situation: optionalString(100),
  message: optionalString(4000),
  confidentiality: z.literal("on", { error: "Merci d'accepter la clause de confidentialité." }),
});

export type VendreFormInput = z.infer<typeof vendreFormSchema>;

export function parseVendreForm(formData: FormData) {
  return vendreFormSchema.safeParse({
    website: formData.get("website"),
    formStartedAt: formData.get("formStartedAt"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    propertyType: emptyToUndefined(formData.get("propertyType")),
    city: formData.get("city"),
    district: formData.get("district"),
    surface: formData.get("surface"),
    rooms: formData.get("rooms"),
    priceMode: formData.get("priceMode"),
    desiredPrice: formData.get("desiredPrice"),
    situation: formData.get("situation"),
    message: formData.get("message"),
    confidentiality: formData.get("confidentiality"),
  });
}

export function isVendreHoneypotFilled(formData: FormData): boolean {
  return isHoneypotFilled(String(formData.get("website") ?? ""));
}

/** Desired price only makes sense when priceMode is "amount" — "advice" leaves the budget open. */
export function vendreBudget(data: VendreFormInput): { budgetMin?: number; budgetMax?: number } {
  if (data.priceMode !== "amount") return {};
  const amount = parseFreeTextAmount(data.desiredPrice);
  return amount ? { budgetMin: amount, budgetMax: amount } : {};
}

// ---------------------------------------------------------------------------
// /off-market
// ---------------------------------------------------------------------------

/** Only a buyer-side profile — never lets a public caller set VENDEUR/LOCATAIRE/AUTRE through this form. */
export const offMarketProfileValues = ["ACHETEUR", "INVESTISSEUR"] as const;

export const offMarketFormSchema = z.object({
  ...antiSpamFields,
  fullName: z.string().trim().min(1, { error: "Nom complet requis." }).max(200),
  phone: z.string().trim().min(1, { error: "Téléphone requis." }).max(30),
  email: z.string().trim().min(1, { error: "E-mail requis." }).email({ error: "E-mail invalide." }).max(200),
  profile: z.enum(offMarketProfileValues, { error: "Profil invalide." }).default("ACHETEUR"),
  citySector: optionalString(200),
  budget: optionalString(30),
  propertyType: z.enum(propertyTypeValues, { error: "Type de bien invalide." }).optional(),
  timeline: optionalString(100),
  message: optionalString(4000),
  confidentiality: z.literal("on", { error: "Merci d'accepter la clause de confidentialité." }),
});

export type OffMarketFormInput = z.infer<typeof offMarketFormSchema>;

export function parseOffMarketForm(formData: FormData) {
  return offMarketFormSchema.safeParse({
    website: formData.get("website"),
    formStartedAt: formData.get("formStartedAt"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    profile: formData.get("profile"),
    citySector: formData.get("citySector"),
    budget: formData.get("budget"),
    propertyType: emptyToUndefined(formData.get("propertyType")),
    timeline: formData.get("timeline"),
    message: formData.get("message"),
    confidentiality: formData.get("confidentiality"),
  });
}

export function isOffMarketHoneypotFilled(formData: FormData): boolean {
  return isHoneypotFilled(String(formData.get("website") ?? ""));
}

export { splitList, parseBudgetRange };

/** "Jean Dupont" -> { firstName: "Jean", lastName: "Dupont" }. Single-word input lands entirely in lastName (required for a PHYSIQUE prospect). */
export function splitFullName(fullName: string): { firstName?: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { lastName: parts[0] ?? fullName.trim() };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}
