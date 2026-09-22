import * as z from "zod";
import { propertyOwnerRoleValues, intermediaryTypeValues, commissionTypeValues } from "@/lib/real-estate-network/enum-labels";
import { optionalString, optionalPercent, optionalPositiveNumber, checkboxBoolean, emptyToUndefined } from "@/lib/admin/zod-helpers";

export const propertyOwnerLinkSchema = z.object({
  ownerId: z.string().trim().min(1, { error: "Propriétaire requis." }),
  role: z.enum(propertyOwnerRoleValues, { error: "Rôle invalide." }).default("PROPRIETAIRE"),
  quoteShare: optionalPercent,
  isMainContact: checkboxBoolean,
});

export type PropertyOwnerLinkInput = z.infer<typeof propertyOwnerLinkSchema>;

export function parsePropertyOwnerLinkForm(formData: FormData) {
  return propertyOwnerLinkSchema.safeParse({
    ownerId: formData.get("ownerId"),
    role: formData.get("role"),
    quoteShare: formData.get("quoteShare"),
    isMainContact: formData.get("isMainContact"),
  });
}

export const propertyIntermediaryLinkSchema = z.object({
  intermediaryId: z.string().trim().min(1, { error: "Intermédiaire requis." }),
  role: z.preprocess(emptyToUndefined, z.enum(intermediaryTypeValues).optional()),
  note: optionalString(600),
  commissionType: z.preprocess(emptyToUndefined, z.enum(commissionTypeValues).optional()),
  commissionRate: optionalPercent,
  commissionAmount: optionalPositiveNumber,
});

export type PropertyIntermediaryLinkInput = z.infer<typeof propertyIntermediaryLinkSchema>;

export function parsePropertyIntermediaryLinkForm(formData: FormData) {
  return propertyIntermediaryLinkSchema.safeParse({
    intermediaryId: formData.get("intermediaryId"),
    role: formData.get("role"),
    note: formData.get("note"),
    commissionType: formData.get("commissionType"),
    commissionRate: formData.get("commissionRate"),
    commissionAmount: formData.get("commissionAmount"),
  });
}

export const propertyDevelopmentLinkSchema = z.object({
  developmentProgramId: z.preprocess(emptyToUndefined, z.string().optional()),
  developmentLotId: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type PropertyDevelopmentLinkInput = z.infer<typeof propertyDevelopmentLinkSchema>;

export function parsePropertyDevelopmentLinkForm(formData: FormData) {
  return propertyDevelopmentLinkSchema.safeParse({
    developmentProgramId: formData.get("developmentProgramId"),
    developmentLotId: formData.get("developmentLotId"),
  });
}
