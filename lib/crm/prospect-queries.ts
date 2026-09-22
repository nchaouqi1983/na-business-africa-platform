import "server-only";
import { prisma } from "@/lib/db";
import {
  Prisma,
  type ProspectType as DbProspectType,
  type ProspectSource as DbProspectSource,
  type ProspectStatus as DbProspectStatus,
  type ProspectFormOrigin as DbProspectFormOrigin,
} from "@/lib/generated/prisma/client";
import { Role } from "@/lib/generated/prisma/enums";
import { prospectAccessWhere } from "@/lib/crm/permissions";
import { demandeStatusValues } from "@/lib/crm/enum-labels";

/**
 * Query layer for the Prospect registry (phase 6G1). Every caller must gate
 * access itself: list/count queries take `role`/`userId` and apply
 * prospectAccessWhere itself, and single-row getters return the ownership
 * fields the Server Component must check with canViewProspect/canEditProspect
 * (see lib/crm/permissions.ts) before rendering anything. Never called from
 * the public site.
 */

export const PROSPECT_PAGE_SIZE = 20;

export type ProspectListFilters = {
  q?: string;
  status?: string;
  type?: string;
  source?: string;
  assignedToId?: string;
  city?: string;
  page?: number;
};

const prospectListInclude = {
  assignedTo: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ProspectInclude;

function displayNameFilter(q: string): Prisma.ProspectWhereInput["OR"] {
  return [
    { reference: { contains: q, mode: "insensitive" } },
    { firstName: { contains: q, mode: "insensitive" } },
    { lastName: { contains: q, mode: "insensitive" } },
    { companyName: { contains: q, mode: "insensitive" } },
    { phone: { contains: q, mode: "insensitive" } },
    { email: { contains: q, mode: "insensitive" } },
  ];
}

export async function listProspects(role: Role, userId: string, filters: ProspectListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where: Prisma.ProspectWhereInput = {};

  const accessWhere = prospectAccessWhere(role, userId);
  if (accessWhere) Object.assign(where, accessWhere);

  if (filters.status) where.status = filters.status as DbProspectStatus;
  if (filters.type) where.type = filters.type as DbProspectType;
  if (filters.source) where.source = filters.source as DbProspectSource;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.city) where.searchCities = { has: filters.city };

  const q = filters.q?.trim();
  if (q) where.OR = displayNameFilter(q);

  const [items, total] = await Promise.all([
    prisma.prospect.findMany({
      where,
      include: prospectListInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PROSPECT_PAGE_SIZE,
      take: PROSPECT_PAGE_SIZE,
    }),
    prisma.prospect.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: PROSPECT_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PROSPECT_PAGE_SIZE)),
  };
}

/** /admin/demandes: newest, unqualified prospects (statut NOUVEAU or A_QUALIFIER), optionally narrowed to one public form origin. */
export async function listDemandes(role: Role, userId: string, formOrigin?: string) {
  const where: Prisma.ProspectWhereInput = { status: { in: [...demandeStatusValues] } };
  const accessWhere = prospectAccessWhere(role, userId);
  if (accessWhere) Object.assign(where, accessWhere);
  if (formOrigin) where.formOrigin = formOrigin as DbProspectFormOrigin;

  return prisma.prospect.findMany({
    where,
    include: prospectListInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/** Minimal Prospect fetch for the "créer une prochaine relance" prompt on /admin/aujourd-hui — no need for the full 360° include. */
export async function getProspectLiteById(id: string) {
  return prisma.prospect.findUnique({
    where: { id },
    select: {
      id: true,
      reference: true,
      firstName: true,
      lastName: true,
      companyName: true,
      createdById: true,
      assignedToId: true,
    },
  });
}

export async function getProspectById(id: string) {
  return prisma.prospect.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      propertyInterests: {
        include: { property: { select: { id: true, reference: true, titleFr: true, city: true, status: true } } },
        orderBy: { createdAt: "desc" },
      },
      visits: {
        include: {
          property: { select: { id: true, reference: true, titleFr: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
        orderBy: { scheduledStart: "desc" },
      },
      activities: {
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      },
    },
  });
}

/** Assignable staff for a Prospect/Visit/Activity's assignedToId picker — the whole back-office team. */
export async function listCrmAssignableUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}

/** Bounded picker for "ajouter un bien d'intérêt" — excludes properties already linked to the prospect. */
export async function searchPropertiesForInterestPicker(prospectId: string, q?: string) {
  const needle = q?.trim();
  return prisma.property.findMany({
    where: {
      prospectInterests: { none: { prospectId } },
      ...(needle ? { OR: [{ titleFr: { contains: needle, mode: "insensitive" } }, { reference: { contains: needle, mode: "insensitive" } }] } : {}),
    },
    select: { id: true, reference: true, titleFr: true, city: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/** Prospects already interested in a given bien — feeds the bien dossier's "Prospects intéressés" section. */
export async function listInterestsForProperty(propertyId: string) {
  return prisma.prospectPropertyInterest.findMany({
    where: { propertyId },
    include: {
      prospect: {
        select: { id: true, reference: true, firstName: true, lastName: true, companyName: true, status: true, assignedToId: true, createdById: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProspectPropertyInterest(prospectId: string, propertyId: string) {
  return prisma.prospectPropertyInterest.findUnique({ where: { prospectId_propertyId: { prospectId, propertyId } } });
}
