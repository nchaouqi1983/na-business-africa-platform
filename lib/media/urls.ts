import { MEDIA_VARIANTS, type MediaVariant } from "@/lib/media/constants";

/**
 * Points at the authenticated streaming route only — never at `public/` or
 * at a future CDN host. Swapping to Cloudflare R2/Images after publication
 * means changing this one function (and the route it points to), not every
 * caller that renders a thumbnail.
 */
export function mediaVariantUrl(mediaId: string, variant: MediaVariant): string {
  return `/api/admin/media/${mediaId}/${variant}`;
}

export function mediaVariantUrls(mediaId: string): Record<MediaVariant, string> {
  return Object.fromEntries(MEDIA_VARIANTS.map((variant) => [variant, mediaVariantUrl(mediaId, variant)])) as Record<
    MediaVariant,
    string
  >;
}
