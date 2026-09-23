import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import type { NetworkEntityStats } from "@/lib/admin/network-stats-types";

export const PROMOTER_PAGE_SIZE = 20;

export type PromoterListFilters = {
  q?: string;
  isActive?: "true" | "false" | "";
  page?: number;
};

export async function listPromoters(filters: PromoterListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where: Prisma.PromoterWhereInput = {};

  if (filters.isActive === "true") where.isActive = true;
  else if (filters.isActive === "false") where.isActive = false;

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { companyName: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.promoter.findMany({
      where,
      orderBy: { companyName: "asc" },
      skip: (page - 1) * PROMOTER_PAGE_SIZE,
      take: PROMOTER_PAGE_SIZE,
      include: { _count: { select: { programs: true } } },
    }),
    prisma.promoter.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: PROMOTER_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PROMOTER_PAGE_SIZE)),
  };
}

/** Bounded list for the "choose or create a promoter" picker used inside the program form. */
export async function searchActivePromoters(q?: string) {
  const needle = q?.trim();
  return prisma.promoter.findMany({
    where: {
      isActive: true,
      ...(needle ? { companyName: { contains: needle, mode: "insensitive" } } : {}),
    },
    orderBy: { companyName: "asc" },
    take: 50,
  });
}

export async function getPromoterById(id: string) {
  return prisma.promoter.findUnique({ where: { id } });
}

/** Vue promoteur : programmes et lots. */
export async function getPromoterWithPrograms(id: string) {
  return prisma.promoter.findUnique({
    where: { id },
    include: {
      programs: {
        orderBy: { name: "asc" },
        include: { _count: { select: { lots: true, properties: true } } },
      },
    },
  });
}

/**
 * 360° dashboard counters for the promoter detail page (phase 6K §4). A
 * promoter has no direct Property relation — everything is scoped through
 * `developmentProgram.promoterId` (a promoter's only link to properties is
 * via its programs). See getOwnerStats for the canSeeFinance contract.
 */
export async function getPromoterStats(promoterId: string, canSeeFinance: boolean): Promise<NetworkEntityStats> {
  const propertyScope: Prisma.PropertyWhereInput = { developmentProgram: { promoterId } };

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
    commissionsPrevues,
    commissionsEncaissees,
  };
}
