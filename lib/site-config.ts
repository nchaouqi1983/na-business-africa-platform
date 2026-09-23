/** Absolute origin the public site is served from — see NEXT_PUBLIC_SITE_URL in .env.example. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Agency phone shown on the public site when OrganizationSettings.phone is empty (same number as the header/footer). */
export const AGENCY_PHONE_FALLBACK = "+212 6 16 17 68 71";
