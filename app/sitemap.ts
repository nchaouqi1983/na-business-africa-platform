import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";
import { getPublicSitemapEntries } from "@/lib/public-catalog/queries";

const STATIC_ROUTES = ["", "/explorer", "/acheter", "/vendre", "/investir", "/villes", "/a-propos", "/contact"];

/**
 * Only PUBLIC + PUBLIE biens are listed — off-market, brouillon, archivé and
 * privé biens (and the /off-market page itself) never appear here and stay
 * noindex on their own page metadata.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getPublicSitemapEntries();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  const propertyEntries: MetadataRoute.Sitemap = entries.map((entry) => ({
    url: `${SITE_URL}/biens/${entry.slug}`,
    lastModified: entry.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticEntries, ...propertyEntries];
}
