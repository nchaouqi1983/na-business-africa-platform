import * as z from "zod";

/**
 * FormData.get() returns null for a field that isn't present at all
 * (distinct from an empty string for one that is present but blank) — both
 * mean "not provided" for every optional field in the admin forms.
 */
export function emptyToUndefined(value: unknown) {
  if (value === null) return undefined;
  if (typeof value !== "string") return value;
  return value.trim() === "" ? undefined : value;
}

export function optionalString(max: number) {
  return z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
}

export const optionalPositiveNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number({ error: "Valeur numérique invalide." }).positive({ error: "Doit être supérieur à 0." }).optional()
);

export const optionalNonNegativeInt = z.preprocess(
  emptyToUndefined,
  z
    .coerce.number({ error: "Valeur numérique invalide." })
    .int({ error: "Doit être un nombre entier." })
    .nonnegative({ error: "Doit être positif ou nul." })
    .optional()
);

export function optionalNumberInRange(min: number, max: number) {
  return z.preprocess(
    emptyToUndefined,
    z
      .coerce.number({ error: "Valeur numérique invalide." })
      .min(min, { error: `Doit être supérieur ou égal à ${min}.` })
      .max(max, { error: `Doit être inférieur ou égal à ${max}.` })
      .optional()
  );
}

export function optionalIntInRange(min: number, max: number) {
  return z.preprocess(
    emptyToUndefined,
    z
      .coerce.number({ error: "Valeur numérique invalide." })
      .int({ error: "Doit être un nombre entier." })
      .min(min, { error: `Doit être supérieur ou égal à ${min}.` })
      .max(max, { error: `Doit être inférieur ou égal à ${max}.` })
      .optional()
  );
}

export const optionalPercent = optionalNumberInRange(0, 100);

/** Native checkbox inputs only appear in FormData when checked ("on"). */
export const checkboxBoolean = z.preprocess((value) => value === "on" || value === true, z.boolean());

export function zodFieldErrors(error: z.ZodError, prefix = ""): Record<string, string> {
  const flat = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages && messages[0]) {
      result[prefix ? `${prefix}.${key}` : key] = messages[0];
    }
  }
  return result;
}
