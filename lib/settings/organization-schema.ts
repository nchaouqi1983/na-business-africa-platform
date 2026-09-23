import * as z from "zod";
import { emptyToUndefined, optionalString } from "@/lib/admin/zod-helpers";

export const languageOptions = [
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "ar", label: "Arabe" },
] as const;

export const timezoneOptions = [
  { value: "Africa/Casablanca", label: "Africa/Casablanca (Maroc)" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "UTC", label: "UTC" },
] as const;

/** The whole back office computes and displays amounts in MAD — no other currency is supported yet. */
export const currencyOptions = [{ value: "MAD", label: "MAD — Dirham marocain" }] as const;

type OptionValues<T extends readonly { value: string }[]> = [T[number]["value"], ...T[number]["value"][]];

function valuesOf<T extends readonly { value: string }[]>(options: T): OptionValues<T> {
  return options.map((option) => option.value) as OptionValues<T>;
}

const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.string().trim().email({ error: "E-mail invalide." }).max(200).optional()
);

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .max(300)
    .url({ error: "URL invalide (ex. https://…)." })
    .refine((value) => /^https?:\/\//i.test(value), { error: "L'URL doit commencer par http:// ou https://." })
    .optional()
);

const optionalPhone = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .max(30)
    .regex(/^[+0-9 ().-]{6,30}$/, { error: "Numéro invalide." })
    .optional()
);

export const organizationSettingsSchema = z.object({
  agencyName: z.string().trim().min(1, { error: "Nom de l'agence requis." }).max(120),
  tagline: optionalString(200),
  email: optionalEmail,
  phone: optionalPhone,
  whatsapp: optionalPhone,
  address: optionalString(240),
  city: optionalString(120),
  website: optionalUrl,
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  defaultLanguage: z.enum(valuesOf(languageOptions), { error: "Langue invalide." }),
  timezone: z.enum(valuesOf(timezoneOptions), { error: "Fuseau horaire invalide." }),
  defaultCurrency: z.enum(valuesOf(currencyOptions), { error: "Devise invalide." }),
});

export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>;

export const organizationSettingsFields = Object.keys(organizationSettingsSchema.shape) as (keyof OrganizationSettingsInput)[];

export function parseOrganizationSettingsForm(formData: FormData) {
  return organizationSettingsSchema.safeParse(
    Object.fromEntries(organizationSettingsFields.map((field) => [field, formData.get(field)]))
  );
}
