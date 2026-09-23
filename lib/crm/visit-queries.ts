import "server-only";
import { prisma } from "@/lib/db";
import { Prisma, type VisitStatus as DbVisitStatus } from "@/lib/generated/prisma/client";
import { Role } from "@/lib/generated/prisma/enums";
import { visitAccessWhere, prospectAccessWhere } from "@/lib/crm/permissions";

/**
 * Query layer for the Visit registry (phase 6G1). Every caller must gate
 * access itself: list queries take `role`/`userId` and apply visitAccessWhere
 * itself, single-row getters return the ownership fields the Server Component
 * must check with canViewVisit/canEditVisit (see lib/crm/permissions.ts).
 */

export const VISIT_PAGE_SIZE = 20;

export type VisitListFilters = {
  status?: string;
  assignedToId?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
};

const visitListInclude = {
  property: { select: { id: true, reference: true, titleFr: true, city: true } },
  prospect: { select: { id: true, reference: true, firstName: true, lastName: true, companyName: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
} satisfies Prisma.VisitInclude;

export async function listVisits(role: Role, userId: string, filters: VisitListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where: Prisma.VisitWhereInput = {};

  const accessWhere = visitAccessWhere(role, userId);
  if (accessWhere) Object.assign(where, accessWhere);

  if (filters.status) where.status = filters.status as DbVisitStatus;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.city) where.property = { city: filters.city };

  if (filters.dateFrom || filters.dateTo) {
    where.scheduledStart = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  const [items, total] = await Promise.all([
    prisma.visit.findMany({
      where,
      include: visitListInclude,
      orderBy: { scheduledStart: "desc" },
      skip: (page - 1) * VISIT_PAGE_SIZE,
      take: VISIT_PAGE_SIZE,
    }),
    prisma.visit.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: VISIT_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / VISIT_PAGE_SIZE)),
  };
}

export async function getVisitById(id: string) {
  return prisma.visit.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, reference: true, titleFr: true, city: true } },
      prospect: { select: { id: true, reference: true, firstName: true, lastName: true, companyName: true, phone: true, status: true, createdById: true, assignedToId: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      activities: { orderBy: { createdAt: "desc" } },
      opportunity: { select: { id: true, reference: true, stage: true, createdById: true, assignedToId: true } },
    },
  });
}

/** Visits attached to a given bien — feeds the bien dossier's "Visites" section. */
export async function listVisitsForProperty(propertyId: string) {
  return prisma.visit.findMany({
    where: { propertyId },
    include: {
      prospect: { select: { id: true, reference: true, firstName: true, lastName: true, companyName: true, createdById: true, assignedToId: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: { scheduledStart: "desc" },
  });
}

/** Bounded picker for the standalone "nouvelle visite" page — active/recent properties. */
export async function searchPropertiesForVisitPicker(q?: string) {
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

/** Bounded picker for the standalone "nouvelle visite" page, scoped to the current user's accessible prospects. */
export async function searchProspectsForVisitPicker(role: Role, userId: string, q?: string) {
  const needle = q?.trim();
  const where: Prisma.ProspectWhereInput = {};
  const accessWhere = prospectAccessWhere(role, userId);
  if (accessWhere) Object.assign(where, accessWhere);
  if (needle) {
    where.OR = [
      { reference: { contains: needle, mode: "insensitive" } },
      { firstName: { contains: needle, mode: "insensitive" } },
      { lastName: { contains: needle, mode: "insensitive" } },
      { companyName: { contains: needle, mode: "insensitive" } },
      { phone: { contains: needle, mode: "insensitive" } },
    ];
  }
  return prisma.prospect.findMany({
    where,
    select: { id: true, reference: true, firstName: true, lastName: true, companyName: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
