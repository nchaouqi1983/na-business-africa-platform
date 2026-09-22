/** Absolute origin the public site is served from — see NEXT_PUBLIC_SITE_URL in .env.example. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
