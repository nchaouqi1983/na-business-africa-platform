import { MEDIA_VARIANTS, type MediaVariant } from "@/lib/media/constants";

/**
 * Points at the public streaming routes only — never at `public/` or a
 * future CDN host directly. See app/api/public/media/[mediaId]/[variant]
 * and app/api/public/documents/[documentId] for the access checks (bien
 * must be publicly visible; master files and restricted document types are
 * never reachable this way).
 */
export function publicMediaVariantUrl(mediaId: string, variant: MediaVariant): string {
  return `/api/public/media/${mediaId}/${variant}`;
}

export function publicMediaVariantUrls(mediaId: string): Record<MediaVariant, string> {
  return Object.fromEntries(MEDIA_VARIANTS.map((variant) => [variant, publicMediaVariantUrl(mediaId, variant)])) as Record<
    MediaVariant,
    string
  >;
}

export function publicDocumentUrl(documentId: string): string {
  return `/api/public/documents/${documentId}`;
}
