import * as z from "zod";
import { partyKindValues, intermediaryTypeValues } from "@/lib/real-estate-network/enum-labels";
import { optionalString, emptyToUndefined } from "@/lib/admin/zod-helpers";

export const intermediaryFormSchema = z.object({
  kind: z.enum(partyKindValues, { error: "Type invalide." }).default("PHYSIQUE"),
  nameOrCompany: z.string().trim().min(1, { error: "Nom / raison sociale requis." }).max(200),
  phone: optionalString(30),
  email: z.preprocess(emptyToUndefined, z.string().trim().email({ error: "E-mail invalide." }).max(200).optional()),
  type: z.enum(intermediaryTypeValues, { error: "Type d'intermédiaire invalide." }).default("AUTRE"),
  city: optionalString(120),
  internalNotes: optionalString(2000),
});

export type IntermediaryFormInput = z.infer<typeof intermediaryFormSchema>;

export function parseIntermediaryForm(formData: FormData) {
  return intermediaryFormSchema.safeParse({
    kind: formData.get("kind"),
    nameOrCompany: formData.get("nameOrCompany"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    type: formData.get("type"),
    city: formData.get("city"),
    internalNotes: formData.get("internalNotes"),
  });
}
