import "server-only";
import { prisma } from "@/lib/db";
import {
  Prisma,
  type CommissionCaseStatus as DbCommissionCaseStatus,
  type CommissionTransactionType as DbCommissionTransactionType,
} from "@/lib/generated/prisma/client";

/**
 * Query layer for the Mandate/CommissionCase financial module (phase 6F).
 * Every caller must gate access itself with canManageFinance(role) — see
 * lib/finance/permissions.ts. Never called from the public site.
 */

export const COMMISSION_CASE_PAGE_SIZE = 20;

export type CommissionCaseListFilters = {
  q?: string;
  status?: string;
  transaction?: string;
  page?: number;
};

const commissionCaseListInclude = {
  property: { select: { id: true, reference: true, titleFr: true, city: true } },
  mandate: { select: { id: true, reference: true } },
} satisfies Prisma.CommissionCaseInclude;

export async function listCommissionCases(filters: CommissionCaseListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where: Prisma.CommissionCaseWhereInput = {};

  if (filters.status) where.status = filters.status as DbCommissionCaseStatus;
  if (filters.transaction) where.transaction = filters.transaction as DbCommissionTransactionType;

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { property: { titleFr: { contains: q, mode: "insensitive" } } },
      { property: { reference: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [items, total, totalsAggregate] = await Promise.all([
    prisma.commissionCase.findMany({
      where,
      include: commissionCaseListInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * COMMISSION_CASE_PAGE_SIZE,
      take: COMMISSION_CASE_PAGE_SIZE,
    }),
    prisma.commissionCase.count({ where }),
    prisma.commissionCase.aggregate({ where, _sum: { agencyCommissionAmount: true } }),
  ]);

  const paidAggregate = await prisma.commissionPayment.aggregate({
    where: { status: { in: ["RECU", "PARTIEL"] }, commissionCase: where },
    _sum: { amount: true },
  });

  return {
    items,
    total,
    page,
    pageSize: COMMISSION_CASE_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / COMMISSION_CASE_PAGE_SIZE)),
    totals: {
      totalAgencyCommission: Number(totalsAggregate._sum.agencyCommissionAmount ?? 0),
      totalPaid: Number(paidAggregate._sum.amount ?? 0),
    },
  };
}

const commissionCaseDetailInclude = {
  property: { select: { id: true, reference: true, titleFr: true, city: true } },
  mandate: { select: { id: true, reference: true, type: true, status: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  shares: {
    include: {
      intermediary: { select: { id: true, nameOrCompany: true } },
      user: { select: { id: true, name: true, email: true } },
      payments: { orderBy: { createdAt: "desc" as const } },
    },
    orderBy: { createdAt: "asc" as const },
  },
  payments: { orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.CommissionCaseInclude;

export async function getCommissionCaseById(id: string) {
  return prisma.commissionCase.findUnique({ where: { id }, include: commissionCaseDetailInclude });
}

/** Commission dossiers attached to a given bien — feeds the internal "Mandat & commissions" section of the dossier. */
export async function listCommissionCasesForProperty(propertyId: string) {
  return prisma.commissionCase.findMany({
    where: { propertyId },
    select: { id: true, reference: true, status: true, transaction: true, agencyCommissionAmount: true, currency: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Mandates ACTIF/BROUILLON for a bien — offered as the mandateId picker when creating a commission case. */
export async function listMandatesForPropertyPicker(propertyId: string) {
  return prisma.mandate.findMany({
    where: { propertyId, status: { in: ["ACTIF", "BROUILLON"] } },
    select: { id: true, reference: true, type: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPropertyForCommissionAccess(propertyId: string) {
  return prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, reference: true, titleFr: true } });
}

/** Sum of non-cancelled (RECU/PARTIEL) payments for one commission case, used for the due/paid/remaining display. */
export async function getCommissionCasePaidTotal(commissionCaseId: string): Promise<number> {
  const result = await prisma.commissionPayment.aggregate({
    where: { commissionCaseId, status: { in: ["RECU", "PARTIEL"] } },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

/** Every staff account — picker source for an AGENT_INTERNE commission share (any role can close a deal, not just AGENT/EDITOR). */
export async function listUsersForCommissionSharePicker() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}

/** Sum of non-cancelled (RECU/PARTIEL) payments for one commission share. */
export async function getCommissionSharePaidTotal(commissionShareId: string): Promise<number> {
  const result = await prisma.commissionPayment.aggregate({
    where: { commissionShareId, status: { in: ["RECU", "PARTIEL"] } },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}
