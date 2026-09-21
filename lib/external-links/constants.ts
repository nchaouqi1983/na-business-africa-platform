/**
 * Shared, framework-agnostic constants for property external links (phase
 * 6D). Nothing here ever fetches from these platforms — a link row is just
 * a validated URL string.
 */

export const externalLinkTypeValues = [
  "VIDEO_YOUTUBE",
  "VIDEO_VIMEO",
  "VISITE_VIRTUELLE",
  "INSTAGRAM",
  "TIKTOK",
  "AUTRE",
] as const;
export type ExternalLinkTypeValue = (typeof externalLinkTypeValues)[number];

export const externalLinkTypeLabels: Record<ExternalLinkTypeValue, string> = {
  VIDEO_YOUTUBE: "Vidéo YouTube",
  VIDEO_VIMEO: "Vidéo Vimeo",
  VISITE_VIRTUELLE: "Visite virtuelle",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  AUTRE: "Autre",
};

/**
 * Strict domain allowlist per platform type — https only, exact domain or a
 * subdomain of it. VISITE_VIRTUELLE and AUTRE have no fixed platform, so
 * they're only required to be a well-formed https URL (see
 * lib/admin/property-external-link-schema.ts).
 */
export const ALLOWED_LINK_DOMAINS: Partial<Record<ExternalLinkTypeValue, readonly string[]>> = {
  VIDEO_YOUTUBE: ["youtube.com", "youtu.be"],
  VIDEO_VIMEO: ["vimeo.com"],
  INSTAGRAM: ["instagram.com"],
  TIKTOK: ["tiktok.com"],
};

export const MAX_LINKS_PER_PROPERTY = 30;
