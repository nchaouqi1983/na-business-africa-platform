import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import type { NetworkEntityStats } from "@/lib/admin/network-stats-types";
import { getOpportunityStatsForProperties } from "@/lib/crm/opportunity-queries";

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

/**
 * 360° dashboard counters for the owner detail page (phase 6K §4).
 * `canSeeFinance` gates the commission aggregates — when false, those two
 * queries are never even run and the fields come back null (not hidden
 * zeros: the caller must not render a "0 MAD" that looks like a real amount).
 * A mandate counts for this owner either because it names them directly
 * (Mandate.ownerId) or because it covers one of their linked properties —
 * the two can diverge since PropertyOwner and Mandate.ownerId are independent.
 */
export async function getOwnerStats(ownerId: string, canSeeFinance: boolean): Promise<NetworkEntityStats> {
  const propertyScope: Prisma.PropertyWhereInput = { owners: { some: { ownerId } } };

  const [propertiesTotal, propertiesPublished, propertiesDraft, propertiesOffMarket, activeMandates, prospectsInterested, visitsScheduled, visitsCompleted] =
    await Promise.all([
      prisma.property.count({ where: propertyScope }),
      prisma.property.count({ where: { ...propertyScope, publicationStatus: "PUBLIE" } }),
      prisma.property.count({ where: { ...propertyScope, publicationStatus: "BROUILLON" } }),
      prisma.property.count({ where: { ...propertyScope, visibility: "OFF_MARKET" } }),
      prisma.mandate.count({ where: { status: "ACTIF", OR: [{ ownerId }, { property: propertyScope }] } }),
      prisma.prospect.count({ where: { propertyInterests: { some: { property: propertyScope } } } }),
      prisma.visit.count({ where: { property: propertyScope, status: { in: ["PLANIFIEE", "CONFIRMEE"] } } }),
      prisma.visit.count({ where: { property: propertyScope, status: "REALISEE" } }),
    ]);

  const opportunityStats = await getOpportunityStatsForProperties(propertyScope);

  let commissionsPrevues: number | null = null;
  let commissionsEncaissees: number | null = null;
  if (canSeeFinance) {
    const [prevues, encaissees] = await Promise.all([
      prisma.commissionCase.aggregate({ where: { property: propertyScope }, _sum: { agencyCommissionAmount: true } }),
      prisma.commissionPayment.aggregate({
        where: { status: { in: ["RECU", "PARTIEL"] }, commissionCase: { property: propertyScope } },
        _sum: { amount: true },
      }),
    ]);
    commissionsPrevues = Number(prevues._sum.agencyCommissionAmount ?? 0);
    commissionsEncaissees = Number(encaissees._sum.amount ?? 0);
  }

  return {
    propertiesTotal,
    propertiesPublished,
    propertiesDraft,
    propertiesOffMarket,
    activeMandates,
    prospectsInterested,
    visitsScheduled,
    visitsCompleted,
    ...opportunityStats,
    commissionsPrevues,
    commissionsEncaissees,
  };
}
