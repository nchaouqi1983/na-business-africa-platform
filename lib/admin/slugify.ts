import "server-only";
import { prisma } from "@/lib/db";

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Generates a unique property slug from a title, appending -2, -3, … when
 * the base slug (or a previous suffix) is already taken. `excludeId` lets an
 * update keep its own slug without colliding with itself.
 */
export async function generateUniquePropertySlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || "bien";

  const existing = await prisma.property.findMany({
    where: {
      slug: { startsWith: base },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { slug: true },
  });

  const taken = new Set(existing.map((property) => property.slug));
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}
