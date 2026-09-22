import * as z from "zod";
import { partyKindValues, contactPreferenceValues } from "@/lib/real-estate-network/enum-labels";
import { optionalString, emptyToUndefined } from "@/lib/admin/zod-helpers";

export const ownerFormSchema = z.object({
  kind: z.enum(partyKindValues, { error: "Type invalide." }).default("PHYSIQUE"),
  fullNameOrCompany: z.string().trim().min(1, { error: "Nom / raison sociale requis." }).max(200),
  cinOrIce: optionalString(50),
  phone: optionalString(30),
  email: z.preprocess(emptyToUndefined, z.string().trim().email({ error: "E-mail invalide." }).max(200).optional()),
  address: optionalString(240),
  city: optionalString(120),
  contactPreference: z.preprocess(emptyToUndefined, z.enum(contactPreferenceValues).optional()),
  internalNotes: optionalString(2000),
});

export type OwnerFormInput = z.infer<typeof ownerFormSchema>;

export function parseOwnerForm(formData: FormData) {
  return ownerFormSchema.safeParse({
    kind: formData.get("kind"),
    fullNameOrCompany: formData.get("fullNameOrCompany"),
    cinOrIce: formData.get("cinOrIce"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    city: formData.get("city"),
    contactPreference: formData.get("contactPreference"),
    internalNotes: formData.get("internalNotes"),
  });
}
