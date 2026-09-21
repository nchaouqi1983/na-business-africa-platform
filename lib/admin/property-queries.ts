import "server-only";
import { prisma } from "@/lib/db";
import {
  Prisma,
  type PublicationStatus as DbPublicationStatus,
  type Visibility as DbVisibility,
  type PropertyTransaction as DbTransaction,
  type PropertyType as DbPropertyType,
} from "@/lib/generated/prisma/client";

/**
 * Query layer for the admin property registry. Never selects the
 * PropertyPrivate relation — this phase has no UI for it, and any future
 * screen that needs it must gate the field selection behind
 * canViewPrivateData(role) itself.
 */

export const PROPERTY_PAGE_SIZE = 20;

export type PropertyListFilters = {
  q?: string;
  publicationStatus?: DbPublicationStatus | "";
  visibility?: DbVisibility | "";
  transaction?: DbTransaction | "";
  propertyType?: DbPropertyType | "";
  city?: string;
  page?: number;
};

export async function listProperties(filters: PropertyListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where: Prisma.PropertyWhereInput = {};

  if (filters.publicationStatus) {
    where.publicationStatus = filters.publicationStatus;
  } else {
    // Archived properties stay out of the default view (visible only via
    // the explicit "Archivé" filter), per spec.
    where.publicationStatus = { not: "ARCHIVE" };
  }

  if (filters.visibility) where.visibility = filters.visibility;
  if (filters.transaction) where.transaction = filters.transaction;
  if (filters.propertyType) where.propertyType = filters.propertyType;
  if (filters.city) where.city = filters.city;

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { titleFr: { contains: q, mode: "insensitive" } },
      { reference: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PROPERTY_PAGE_SIZE,
      take: PROPERTY_PAGE_SIZE,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: PROPERTY_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PROPERTY_PAGE_SIZE)),
  };
}

export async function listDistinctCities(): Promise<string[]> {
  const rows = await prisma.property.findMany({
    distinct: ["city"],
    select: { city: true },
    orderBy: { city: "asc" },
  });
  return rows.map((row) => row.city);
}

export async function getPropertyKpis() {
  const [total, brouillons, publies, offMarket, archives] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({ where: { publicationStatus: "BROUILLON" } }),
    prisma.property.count({ where: { publicationStatus: "PUBLIE" } }),
    prisma.property.count({ where: { visibility: "OFF_MARKET" } }),
    prisma.property.count({ where: { publicationStatus: "ARCHIVE" } }),
  ]);

  return { total, brouillons, publies, offMarket, archives };
}

export async function getPropertyById(id: string) {
  return prisma.property.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      tags: { select: { slug: true } },
    },
  });
}

export async function getPropertyPrivateById(propertyId: string) {
  return prisma.propertyPrivate.findUnique({ where: { propertyId } });
}

/** AGENT and EDITOR accounts — the only roles a property can be assigned to. */
export async function listAssignableUsers() {
  return prisma.user.findMany({
    where: { role: { in: ["AGENT", "EDITOR"] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}
