import * as z from "zod";

export const patchMediaSchema = z
  .object({
    altText: z.string().trim().max(300, "300 caractères maximum.").nullable().optional(),
    isCover: z.boolean().optional(),
  })
  .refine((value) => value.altText !== undefined || value.isCover !== undefined, {
    message: "Aucune modification fournie.",
  });

export type PatchMediaInput = z.infer<typeof patchMediaSchema>;

export const reorderMediaSchema = z.object({
  order: z.array(z.string().min(1)).min(1),
});
