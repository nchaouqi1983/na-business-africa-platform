import "server-only";
import { prisma } from "@/lib/db";
import { tagCategoryFromDb } from "@/lib/admin/property-enum-maps";
import type { TagCategory } from "@/lib/property-schema";

export type TagOption = {
  slug: string;
  labelFr: string;
  category: TagCategory;
};

export async function listActiveTags(): Promise<TagOption[]> {
  const rows = await prisma.propertyTag.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { labelFr: "asc" }],
  });
  return rows.map((row) => ({ slug: row.slug, labelFr: row.labelFr, category: tagCategoryFromDb[row.category] }));
}

/** Filters submitted slugs down to those that actually exist and are active — tags are only ever attached from real picks, never freeform. */
export async function resolveExistingActiveTagSlugs(slugs: string[]): Promise<string[]> {
  if (slugs.length === 0) return [];
  const rows = await prisma.propertyTag.findMany({
    where: { slug: { in: slugs }, isActive: true },
    select: { slug: true },
  });
  return rows.map((row) => row.slug);
}
