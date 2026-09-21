/**
 * Shared, framework-agnostic constants for property media (phase 6C).
 * Kept dependency-free so both server code and the client upload queue can
 * import from here without pulling in "server-only" modules.
 */

export const MAX_ORIGINAL_FILE_BYTES = 25 * 1024 * 1024; // 25 Mo
export const MAX_PHOTOS_PER_PROPERTY = 30;
export const MAX_UPLOAD_CONCURRENCY = 3;

export const ACCEPTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AcceptedImageMimeType = (typeof ACCEPTED_IMAGE_MIME_TYPES)[number];

export const ACCEPTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export const MEDIA_VARIANTS = ["thumb", "card", "gallery", "large"] as const;
export type MediaVariant = (typeof MEDIA_VARIANTS)[number];

export const MEDIA_VARIANT_WIDTHS: Record<MediaVariant, number> = {
  thumb: 480,
  card: 768,
  gallery: 1440,
  large: 2400,
};

export const MEDIA_VARIANT_WEBP_QUALITY = 82;

export function isMediaVariant(value: string): value is MediaVariant {
  return (MEDIA_VARIANTS as readonly string[]).includes(value);
}
