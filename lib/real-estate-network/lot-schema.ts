import * as z from "zod";
import { lotStatusValues } from "@/lib/real-estate-network/enum-labels";
import { optionalString, optionalPositiveNumber, emptyToUndefined } from "@/lib/admin/zod-helpers";

export const lotFormSchema = z.object({
  reference: z.string().trim().min(1, { error: "Référence du lot requise." }).max(80),
  lotType: optionalString(80),
  typology: optionalString(80),
  surface: optionalPositiveNumber,
  price: optionalPositiveNumber,
  status: z.enum(lotStatusValues, { error: "Statut invalide." }).default("DISPONIBLE"),
  floor: optionalString(40),
  block: optionalString(40),
  extraInfo: z.preprocess(emptyToUndefined, z.string().max(4000).optional()),
});

export type LotFormInput = z.infer<typeof lotFormSchema>;

export function parseLotForm(formData: FormData) {
  return lotFormSchema.safeParse({
    reference: formData.get("reference"),
    lotType: formData.get("lotType"),
    typology: formData.get("typology"),
    surface: formData.get("surface"),
    price: formData.get("price"),
    status: formData.get("status"),
    floor: formData.get("floor"),
    block: formData.get("block"),
    extraInfo: formData.get("extraInfo"),
  });
}

/** `extraInfo` is a free-form JSON textarea — validated separately since a bad JSON string must not crash the parse. */
export function parseExtraInfoJson(raw: string | undefined): { ok: true; value: object | undefined } | { ok: false } {
  if (!raw) return { ok: true, value: undefined };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { ok: true, value: parsed as object };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
