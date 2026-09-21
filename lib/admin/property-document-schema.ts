import * as z from "zod";
import { assetVisibilityValues, documentTypeValues } from "@/lib/documents/constants";

export const uploadDocumentMetaSchema = z.object({
  type: z.enum(documentTypeValues, { message: "Type de document invalide." }),
  title: z
    .string()
    .trim()
    .min(1, "Titre requis.")
    .max(200, "200 caractères maximum."),
  visibility: z.enum(assetVisibilityValues).optional().default("INTERNE"),
});

export const patchDocumentSchema = z
  .object({
    title: z.string().trim().min(1, "Titre requis.").max(200, "200 caractères maximum.").optional(),
    type: z.enum(documentTypeValues).optional(),
    visibility: z.enum(assetVisibilityValues).optional(),
  })
  .refine((value) => value.title !== undefined || value.type !== undefined || value.visibility !== undefined, {
    message: "Aucune modification fournie.",
  });

export type PatchDocumentInput = z.infer<typeof patchDocumentSchema>;

export const reorderDocumentsSchema = z.object({
  order: z.array(z.string().min(1)).min(1),
});
