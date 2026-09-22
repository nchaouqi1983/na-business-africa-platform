import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Query layer for the Owner registry (phase 6E). Every caller must gate
 * access itself with canManageRealEstateNetwork(role) — see
 * lib/real-estate-network/permissions.ts. Never called from the public site.
 */

export const OWNER_PAGE_SIZE = 20;

export type OwnerListFilters = {
  q?: string;
  isActive?: "true" | "false" | "";
  page?: number;
};

export async function listOwners(filters: OwnerListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where: Prisma.OwnerWhereInput = {};

  if (filters.isActive === "true") where.isActive = true;
  else if (filters.isActive === "false") where.isActive = false;

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { fullNameOrCompany: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { cinOrIce: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.owner.findMany({
      where,
      orderBy: { fullNameOrCompany: "asc" },
      skip: (page - 1) * OWNER_PAGE_SIZE,
      take: OWNER_PAGE_SIZE,
    }),
    prisma.owner.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: OWNER_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / OWNER_PAGE_SIZE)),
  };
}

/** Bounded list for the property-linking picker — active owners only. */
export async function searchActiveOwners(q?: string) {
  const needle = q?.trim();
  return prisma.owner.findMany({
    where: {
      isActive: true,
      ...(needle ? { fullNameOrCompany: { contains: needle, mode: "insensitive" } } : {}),
    },
    orderBy: { fullNameOrCompany: "asc" },
    take: 50,
  });
}

export async function getOwnerById(id: string) {
  return prisma.owner.findUnique({ where: { id } });
}

/** Vue 360° : le propriétaire et chacun des biens auxquels il est rattaché. */
export async function getOwnerWithProperties(id: string) {
  return prisma.owner.findUnique({
    where: { id },
    include: {
      propertyLinks: {
        include: {
          property: {
            select: {
              id: true,
              reference: true,
              titleFr: true,
              city: true,
              status: true,
              publicationStatus: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
