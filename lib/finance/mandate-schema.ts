import * as z from "zod";
import { mandateTypeValues, mandateStatusValues } from "@/lib/finance/enum-labels";
import { optionalString, optionalPositiveNumber, checkboxBoolean, emptyToUndefined } from "@/lib/admin/zod-helpers";

export const mandateFormSchema = z.object({
  ownerId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  type: z.enum(mandateTypeValues, { error: "Type de mandat invalide." }),
  status: z.enum(mandateStatusValues, { error: "Statut invalide." }).default("BROUILLON"),
  startDate: optionalString(10),
  endDate: optionalString(10),
  isExclusive: checkboxBoolean,
  displayedPrice: optionalPositiveNumber,
  agreedNetSellerPrice: optionalPositiveNumber,
  internalConditions: optionalString(4000),
  documentId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

export type MandateFormInput = z.infer<typeof mandateFormSchema>;

export function parseMandateForm(formData: FormData) {
  return mandateFormSchema.safeParse({
    ownerId: formData.get("ownerId"),
    type: formData.get("type"),
    status: formData.get("status"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    isExclusive: formData.get("isExclusive"),
    displayedPrice: formData.get("displayedPrice"),
    agreedNetSellerPrice: formData.get("agreedNetSellerPrice"),
    internalConditions: formData.get("internalConditions"),
    documentId: formData.get("documentId"),
  });
}

/** Quick-create panel embedded in the bien dossier — type only, everything else defaults. */
export const mandateQuickFormSchema = z.object({
  type: z.enum(mandateTypeValues, { error: "Type de mandat invalide." }),
  ownerId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

export type MandateQuickFormInput = z.infer<typeof mandateQuickFormSchema>;

export function parseMandateQuickForm(formData: FormData) {
  return mandateQuickFormSchema.safeParse({
    type: formData.get("type"),
    ownerId: formData.get("ownerId"),
  });
}
