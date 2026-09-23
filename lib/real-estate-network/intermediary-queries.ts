import "server-only";
import { prisma } from "@/lib/db";
import { Prisma, type IntermediaryType as DbIntermediaryType } from "@/lib/generated/prisma/client";
import type { NetworkEntityStats } from "@/lib/admin/network-stats-types";

export const INTERMEDIARY_PAGE_SIZE = 20;

export type IntermediaryListFilters = {
  q?: string;
  type?: string;
  isActive?: "true" | "false" | "";
  page?: number;
};

export async function listIntermediaries(filters: IntermediaryListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where: Prisma.IntermediaryWhereInput = {};

  if (filters.isActive === "true") where.isActive = true;
  else if (filters.isActive === "false") where.isActive = false;
  if (filters.type) where.type = filters.type as DbIntermediaryType;

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { nameOrCompany: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.intermediary.findMany({
      where,
      orderBy: { nameOrCompany: "asc" },
      skip: (page - 1) * INTERMEDIARY_PAGE_SIZE,
      take: INTERMEDIARY_PAGE_SIZE,
    }),
    prisma.intermediary.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: INTERMEDIARY_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / INTERMEDIARY_PAGE_SIZE)),
  };
}

/** Bounded list for the property-linking picker — active intermediaries only. */
export async function searchActiveIntermediaries(q?: string) {
  const needle = q?.trim();
  return prisma.intermediary.findMany({
    where: {
      isActive: true,
      ...(needle ? { nameOrCompany: { contains: needle, mode: "insensitive" } } : {}),
    },
    orderBy: { nameOrCompany: "asc" },
    take: 50,
  });
}

export async function getIntermediaryById(id: string) {
  return prisma.intermediary.findUnique({ where: { id } });
}

/** Vue intermédiaire : biens liés. */
export async function getIntermediaryWithProperties(id: string) {
  return prisma.intermediary.findUnique({
    where: { id },
    include: {
      propertyLinks: {
        include: {
          property: {
            select: { id: true, reference: true, titleFr: true, city: true, status: true, publicationStatus: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * 360° dashboard counters for the intermediary detail page (phase 6K §4).
 * Unlike Owner/Promoter, commissions here are the intermediary's OWN share
 * of each case (CommissionShare.computedAmount / its own payments), never
 * the property's whole agency commission — an intermediary is normally paid
 * a cut, not the full amount. See getOwnerStats for the canSeeFinance
 * contract and the general property-count/visits/prospects pattern.
 */
export async function getIntermediaryStats(intermediaryId: string, canSeeFinance: boolean): Promise<NetworkEntityStats> {
  const propertyScope: Prisma.PropertyWhereInput = { intermediaries: { some: { intermediaryId } } };

  const [propertiesTotal, propertiesPublished, propertiesDraft, propertiesOffMarket, activeMandates, prospectsInterested, visitsScheduled, visitsCompleted] =
    await Promise.all([
      prisma.property.count({ where: propertyScope }),
      prisma.property.count({ where: { ...propertyScope, publicationStatus: "PUBLIE" } }),
      prisma.property.count({ where: { ...propertyScope, publicationStatus: "BROUILLON" } }),
      prisma.property.count({ where: { ...propertyScope, visibility: "OFF_MARKET" } }),
      prisma.mandate.count({ where: { status: "ACTIF", property: propertyScope } }),
      prisma.prospect.count({ where: { propertyInterests: { some: { property: propertyScope } } } }),
      prisma.visit.count({ where: { property: propertyScope, status: { in: ["PLANIFIEE", "CONFIRMEE"] } } }),
      prisma.visit.count({ where: { property: propertyScope, status: "REALISEE" } }),
    ]);

  let commissionsPrevues: number | null = null;
  let commissionsEncaissees: number | null = null;
  if (canSeeFinance) {
    const [prevues, encaissees] = await Promise.all([
      prisma.commissionShare.aggregate({ where: { intermediaryId }, _sum: { computedAmount: true } }),
      prisma.commissionPayment.aggregate({
        where: { status: { in: ["RECU", "PARTIEL"] }, commissionShare: { intermediaryId } },
        _sum: { amount: true },
      }),
    ]);
    commissionsPrevues = Number(prevues._sum.computedAmount ?? 0);
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
    commissionsPrevues,
    commissionsEncaissees,
  };
}
