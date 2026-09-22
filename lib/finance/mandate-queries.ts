import "server-only";
import { prisma } from "@/lib/db";
import { Prisma, type MandateType as DbMandateType, type MandateStatus as DbMandateStatus } from "@/lib/generated/prisma/client";

/**
 * Query layer for the Mandate registry (phase 6F). Every caller must gate
 * access itself with canManageFinance(role) — see lib/finance/permissions.ts.
 * Never called from the public site.
 */

export const MANDATE_PAGE_SIZE = 20;

/** Mandates ACTIF whose endDate falls within this many days are flagged on the list page. */
export const MANDATE_EXPIRY_WARNING_DAYS = 30;

export type MandateListFilters = {
  q?: string;
  status?: string;
  type?: string;
  expiringOnly?: boolean;
  page?: number;
};

const mandateListInclude = {
  property: { select: { id: true, reference: true, titleFr: true, city: true } },
  owner: { select: { id: true, fullNameOrCompany: true } },
} satisfies Prisma.MandateInclude;

function expiryThreshold(): Date {
  const date = new Date();
  date.setDate(date.getDate() + MANDATE_EXPIRY_WARNING_DAYS);
  return date;
}

export async function listMandates(filters: MandateListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where: Prisma.MandateWhereInput = {};

  if (filters.status) where.status = filters.status as DbMandateStatus;
  if (filters.type) where.type = filters.type as DbMandateType;

  if (filters.expiringOnly) {
    where.status = "ACTIF";
    where.endDate = { not: null, lte: expiryThreshold() };
  }

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { property: { titleFr: { contains: q, mode: "insensitive" } } },
      { property: { reference: { contains: q, mode: "insensitive" } } },
      { owner: { fullNameOrCompany: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.mandate.findMany({
      where,
      include: mandateListInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * MANDATE_PAGE_SIZE,
      take: MANDATE_PAGE_SIZE,
    }),
    prisma.mandate.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: MANDATE_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / MANDATE_PAGE_SIZE)),
  };
}

/** Mandates ACTIF expiring within MANDATE_EXPIRY_WARNING_DAYS — feeds the list page's alert banner. */
export async function listExpiringMandates() {
  return prisma.mandate.findMany({
    where: { status: "ACTIF", endDate: { not: null, lte: expiryThreshold() } },
    include: mandateListInclude,
    orderBy: { endDate: "asc" },
    take: 50,
  });
}

export async function getMandateById(id: string) {
  return prisma.mandate.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, reference: true, titleFr: true, city: true } },
      owner: { select: { id: true, fullNameOrCompany: true } },
      document: { select: { id: true, title: true, originalFilename: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      commissionCases: {
        select: { id: true, reference: true, status: true, transaction: true, agencyCommissionAmount: true, currency: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/** Mandates attached to a given bien — feeds the internal "Mandat & commissions" section of the dossier. */
export async function listMandatesForProperty(propertyId: string) {
  return prisma.mandate.findMany({
    where: { propertyId },
    include: {
      owner: { select: { id: true, fullNameOrCompany: true } },
      commissionCases: { select: { id: true, reference: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** MANDAT-type documents already uploaded for a bien — picker source when linking a mandate to its scanned PDF. */
export async function listMandateDocumentsForProperty(propertyId: string) {
  return prisma.propertyDocument.findMany({
    where: { propertyId, type: "MANDAT" },
    select: { id: true, title: true, originalFilename: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPropertyForMandateAccess(propertyId: string) {
  return prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, reference: true, titleFr: true } });
}

/** Bounded picker for the standalone "nouveau mandat" page, which isn't opened from a bien dossier. */
export async function searchPropertiesForPicker(q?: string) {
  const needle = q?.trim();
  return prisma.property.findMany({
    where: needle
      ? { OR: [{ titleFr: { contains: needle, mode: "insensitive" } }, { reference: { contains: needle, mode: "insensitive" } }] }
      : {},
    select: { id: true, reference: true, titleFr: true, city: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
