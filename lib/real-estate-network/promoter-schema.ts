import * as z from "zod";
import { optionalString, emptyToUndefined } from "@/lib/admin/zod-helpers";

export const promoterFormSchema = z.object({
  companyName: z.string().trim().min(1, { error: "Raison sociale requise." }).max(200),
  mainContactName: optionalString(120),
  phone: optionalString(30),
  email: z.preprocess(emptyToUndefined, z.string().trim().email({ error: "E-mail invalide." }).max(200).optional()),
  website: z.preprocess(emptyToUndefined, z.string().trim().url({ error: "URL invalide." }).max(300).optional()),
  ice: optionalString(50),
  address: optionalString(240),
  city: optionalString(120),
  internalNotes: optionalString(2000),
});

export type PromoterFormInput = z.infer<typeof promoterFormSchema>;

export function parsePromoterForm(formData: FormData) {
  return promoterFormSchema.safeParse({
    companyName: formData.get("companyName"),
    mainContactName: formData.get("mainContactName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    website: formData.get("website"),
    ice: formData.get("ice"),
    address: formData.get("address"),
    city: formData.get("city"),
    internalNotes: formData.get("internalNotes"),
  });
}
