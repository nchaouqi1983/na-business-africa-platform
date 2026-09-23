import "server-only";
import { prisma } from "@/lib/db";
import {
  Prisma,
  type PublicationStatus as DbPublicationStatus,
  type Visibility as DbVisibility,
  type PropertyTransaction as DbTransaction,
  type PropertyType as DbPropertyType,
  type PropertyStatus as DbPropertyStatus,
} from "@/lib/generated/prisma/client";
import type { Role } from "@/lib/auth/roles";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import { canManageFinance } from "@/lib/finance/permissions";
import { MANDATE_EXPIRY_WARNING_DAYS } from "@/lib/finance/mandate-queries";

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
  status?: DbPropertyStatus | "";
  transaction?: DbTransaction | "";
  propertyType?: DbPropertyType | "";
  propertySubtype?: string;
  city?: string;
  district?: string;
  priceMin?: number;
  priceMax?: number;
  surfaceMin?: number;
  bedroomsMin?: number;
  tags?: string[];
  isFeatured?: boolean;
  isGoodDeal?: boolean;
  isCoupDeCoeur?: boolean;
  isExclusive?: boolean;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  assignedToId?: string;
  /** Free text matched against the linked owner's name/phone/e-mail — SUPER_ADMIN/ADMIN only, silently ignored otherwise. */
  ownerQuery?: string;
  /** Free text matched against the linked promoter's company name/phone/e-mail (via developmentProgram.promoter) — SUPER_ADMIN/ADMIN only. */
  promoterQuery?: string;
  /** Free text matched against a linked intermediary's name/phone/e-mail — SUPER_ADMIN/ADMIN only. */
  intermediaryQuery?: string;
  /** Exact-match relation filters (dashboard "N biens liés" links) — SUPER_ADMIN/ADMIN only. */
  ownerId?: string;
  promoterId?: string;
  intermediaryId?: string;
  developmentProgramId?: string;
  developmentLotId?: string;
  /** SUPER_ADMIN/ADMIN only — silently ignored otherwise. */
  mandateActive?: boolean;
  mandateExclusive?: boolean;
  mandateExpiring?: boolean;
  hasPhotos?: "with" | "without" | "";
  hasDocuments?: "with" | "without" | "";
  importSource?: string;
  sourceExternalId?: string;
  page?: number;
};

/**
 * `viewerRole` re-checks the network/finance-only filters server-side —
 * never trusts that a UI simply hid those fields; a forged query string from
 * an AGENT/EDITOR/VIEWER must have zero effect on owner/promoter/
 * intermediary/mandate filtering.
 */
export async function listProperties(filters: PropertyListFilters, viewerRole: Role) {
  const page = Math.max(1, filters.page ?? 1);
  const where: Prisma.PropertyWhereInput = {};
  const and: Prisma.PropertyWhereInput[] = [];

  if (filters.publicationStatus) {
    where.publicationStatus = filters.publicationStatus;
  } else {
    // Archived properties stay out of the default view (visible only via
    // the explicit "Archivé" filter), per spec.
    where.publicationStatus = { not: "ARCHIVE" };
  }

  if (filters.visibility) where.visibility = filters.visibility;
  if (filters.status) where.status = filters.status;
  if (filters.transaction) where.transaction = filters.transaction;
  if (filters.propertyType) where.propertyType = filters.propertyType;
  if (filters.propertySubtype) where.propertySubtype = filters.propertySubtype;
  if (filters.city) where.city = filters.city;
  if (filters.district) where.district = { contains: filters.district, mode: "insensitive" };

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { titleFr: { contains: q, mode: "insensitive" } },
      { reference: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { district: { contains: q, mode: "insensitive" } },
      { shortDescription: { contains: q, mode: "insensitive" } },
      { descriptionFr: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filters.priceMin !== undefined) and.push({ price: { gte: filters.priceMin } });
  if (filters.priceMax !== undefined) and.push({ price: { lte: filters.priceMax } });
  if (filters.surfaceMin !== undefined) and.push({ livingArea: { gte: filters.surfaceMin } });
  if (filters.bedroomsMin !== undefined) and.push({ bedrooms: { gte: filters.bedroomsMin } });

  if (filters.tags && filters.tags.length > 0) {
    for (const slug of filters.tags) and.push({ tags: { some: { slug } } });
  }

  if (filters.isFeatured) where.isFeatured = true;
  if (filters.isGoodDeal) where.isGoodDeal = true;
  if (filters.isCoupDeCoeur) where.isCoupDeCoeur = true;
  if (filters.isExclusive) where.isExclusive = true;

  if (filters.createdFrom) and.push({ createdAt: { gte: new Date(filters.createdFrom) } });
  if (filters.createdTo) and.push({ createdAt: { lte: endOfDay(filters.createdTo) } });
  if (filters.updatedFrom) and.push({ updatedAt: { gte: new Date(filters.updatedFrom) } });
  if (filters.updatedTo) and.push({ updatedAt: { lte: endOfDay(filters.updatedTo) } });

  if (filters.assignedToId) where.assignedToId = filters.assignedToId;

  if (filters.importSource) where.importSource = filters.importSource;
  if (filters.sourceExternalId) where.sourceExternalId = { contains: filters.sourceExternalId, mode: "insensitive" };

  if (filters.hasPhotos === "with") where.media = { some: {} };
  else if (filters.hasPhotos === "without") where.media = { none: {} };

  if (filters.hasDocuments === "with") where.documents = { some: {} };
  else if (filters.hasDocuments === "without") where.documents = { none: {} };

  if (filters.developmentProgramId) where.developmentProgramId = filters.developmentProgramId;
  if (filters.developmentLotId) where.developmentLotId = filters.developmentLotId;

  const canSeeNetwork = canManageRealEstateNetwork(viewerRole);
  if (canSeeNetwork && filters.ownerId) where.owners = { some: { ownerId: filters.ownerId } };
  if (canSeeNetwork && filters.promoterId) where.developmentProgram = { promoterId: filters.promoterId };
  if (canSeeNetwork && filters.intermediaryId) where.intermediaries = { some: { intermediaryId: filters.intermediaryId } };

  if (canSeeNetwork && filters.ownerQuery?.trim()) {
    const query = filters.ownerQuery.trim();
    where.owners = {
      some: {
        owner: {
          OR: [
            { fullNameOrCompany: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
      },
    };
  }
  if (canSeeNetwork && filters.promoterQuery?.trim()) {
    const query = filters.promoterQuery.trim();
    where.developmentProgram = {
      promoter: {
        OR: [
          { companyName: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
    };
  }
  if (canSeeNetwork && filters.intermediaryQuery?.trim()) {
    const query = filters.intermediaryQuery.trim();
    where.intermediaries = {
      some: {
        intermediary: {
          OR: [
            { nameOrCompany: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
      },
    };
  }

  const canSeeFinance = canManageFinance(viewerRole);
  if (canSeeFinance && filters.mandateActive) and.push({ mandates: { some: { status: "ACTIF" } } });
  if (canSeeFinance && filters.mandateExclusive) and.push({ mandates: { some: { isExclusive: true } } });
  if (canSeeFinance && filters.mandateExpiring) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + MANDATE_EXPIRY_WARNING_DAYS);
    and.push({ mandates: { some: { status: "ACTIF", endDate: { gte: new Date(), lte: threshold } } } });
  }

  if (and.length > 0) where.AND = and;

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PROPERTY_PAGE_SIZE,
      take: PROPERTY_PAGE_SIZE,
      include: {
        _count: { select: { media: true, documents: true } },
        // Thumbnail for the list table (phase 6L UI fix) — cover photo only, never the full gallery.
        media: { where: { isCover: true }, take: 1, select: { id: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
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

function endOfDay(isoDate: string): Date {
  const date = new Date(isoDate);
  date.setHours(23, 59, 59, 999);
  return date;
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
