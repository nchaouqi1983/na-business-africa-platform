import * as z from "zod";
import { assetVisibilityValues } from "@/lib/documents/constants";
import { ALLOWED_LINK_DOMAINS, externalLinkTypeValues, type ExternalLinkTypeValue } from "@/lib/external-links/constants";

/**
 * Validates that `raw` is an https URL whose hostname is allowed for
 * `type` — for YOUTUBE/VIMEO/INSTAGRAM/TIKTOK this means the exact domain
 * (or a subdomain of it) from ALLOWED_LINK_DOMAINS; for VISITE_VIRTUELLE and
 * AUTRE (no fixed platform) only the https+well-formed-URL check applies.
 * Never fetches the URL — string/hostname validation only.
 */
export function validateExternalLinkUrl(type: ExternalLinkTypeValue, raw: string): { ok: true; url: string } | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) {
    return { ok: false, message: "URL invalide." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, message: "URL invalide." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, message: "L'URL doit commencer par https://." };
  }

  const allowedDomains = ALLOWED_LINK_DOMAINS[type];
  if (allowedDomains) {
    const host = parsed.hostname.toLowerCase();
    const isAllowed = allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
    if (!isAllowed) {
      return { ok: false, message: `Domaine non autorisé pour ce type de lien (attendu : ${allowedDomains.join(", ")}).` };
    }
  }

  return { ok: true, url: trimmed };
}

export const createExternalLinkSchema = z.object({
  type: z.enum(externalLinkTypeValues, { message: "Type de lien invalide." }),
  url: z.string().trim().min(1, "URL requise."),
  title: z.string().trim().max(200, "200 caractères maximum.").optional(),
  visibility: z.enum(assetVisibilityValues).optional().default("INTERNE"),
});

export const patchExternalLinkSchema = z
  .object({
    type: z.enum(externalLinkTypeValues).optional(),
    url: z.string().trim().min(1).optional(),
    title: z.string().trim().max(200, "200 caractères maximum.").nullable().optional(),
    visibility: z.enum(assetVisibilityValues).optional(),
  })
  .refine(
    (value) => value.type !== undefined || value.url !== undefined || value.title !== undefined || value.visibility !== undefined,
    { message: "Aucune modification fournie." }
  );

export type PatchExternalLinkInput = z.infer<typeof patchExternalLinkSchema>;

export const reorderExternalLinksSchema = z.object({
  order: z.array(z.string().min(1)).min(1),
});
