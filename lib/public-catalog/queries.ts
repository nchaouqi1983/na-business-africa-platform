import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  transactionToDb,
  propertyTypeToDb,
  conditionToDb,
  furnishedToDb,
} from "@/lib/admin/property-enum-maps";
import type { Property, PropertyFilterState } from "@/lib/property-schema";
import { toPublicProperty } from "@/lib/public-catalog/mapper";
import { EXPLORER_PAGE_SIZE } from "@/lib/public-catalog/filters";

/**
 * Server-only Prisma queries for the public catalogue. Every query here
 * enforces the publication gate itself (never relies on a caller to do it)
 * and selects an explicit field allowlist — a raw Prisma row never leaves
 * this module; every caller gets a mapped `Property` DTO instead. Private
 * relations (PropertyPrivate, owners, mandates, commissions, CRM data,
 * restricted documents, media masters) are never selected here.
 */

const PUBLIC_PROPERTY_SELECT = {
  id: true,
  reference: true,
  slug: true,
  titleFr: true,
  shortDescription: true,
  descriptionFr: true,
  transaction: true,
  propertyType: true,
  propertySubtype: true,
  status: true,
  publicationStatus: true,
  visibility: true,
  city: true,
  district: true,
  latitude: true,
  longitude: true,
  price: true,
  priceOnRequest: true,
  pricePerSqm: true,
  negotiable: true,
  monthlyCharges: true,
  securityDeposit: true,
  estimatedYieldPercent: true,
  livingArea: true,
  builtArea: true,
  landArea: true,
  terraceArea: true,
  balconyArea: true,
  basementArea: true,
  bedrooms: true,
  suites: true,
  bathrooms: true,
  salons: true,
  kitchens: true,
  parkingSpaces: true,
  floor: true,
  totalFloors: true,
  yearBuilt: true,
  furnished: true,
  condition: true,
  orientation: true,
  isFeatured: true,
  isGoodDeal: true,
  isCoupDeCoeur: true,
  isCreditEligible: true,
  isMourabahaEligible: true,
  details: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  assignedToId: true,
  tags: { select: { slug: true, category: true } },
  media: {
    select: { id: true, sortOrder: true, isCover: true },
    orderBy: { sortOrder: "asc" as const },
  },
  documents: {
    where: { visibility: "PUBLIABLE" as const, type: { in: ["BROCHURE", "PLAN"] as const } },
    select: { id: true, type: true },
    orderBy: { sortOrder: "asc" as const },
  },
  externalLinks: {
    where: { visibility: "PUBLIABLE" as const },
    select: { type: true, url: true },
    orderBy: { sortOrder: "asc" as const },
  },
} satisfies Prisma.PropertySelect;

export type PublicPropertyRow = Prisma.PropertyGetPayload<{ select: typeof PUBLIC_PROPERTY_SELECT }>;

const PUBLIC_BASE_WHERE = { publicationStatus: "PUBLIE", visibility: "PUBLIC" } satisfies Prisma.PropertyWhereInput;

function toNumberOrUndefined(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function buildWhere(filters: PropertyFilterState): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = { ...PUBLIC_BASE_WHERE };

  const keyword = filters.keyword.trim();
  if (keyword) {
    where.OR = [
      { titleFr: { contains: keyword, mode: "insensitive" } },
      { reference: { contains: keyword, mode: "insensitive" } },
      { city: { contains: keyword, mode: "insensitive" } },
    ];
  }

  if (filters.transaction) where.transaction = transactionToDb[filters.transaction];
  if (filters.type) where.propertyType = propertyTypeToDb[filters.type];
  if (filters.subType) where.propertySubtype = filters.subType;
  if (filters.city) where.city = filters.city;
  if (filters.district) where.district = filters.district;
  if (filters.condition) where.condition = conditionToDb[filters.condition];
  if (filters.furnished) where.furnished = furnishedToDb[filters.furnished];

  const budgetMin = toNumberOrUndefined(filters.budgetMin);
  const budgetMax = toNumberOrUndefined(filters.budgetMax);
  if (!filters.priceOnRequestOnly && (budgetMin !== undefined || budgetMax !== undefined)) {
    where.price = { ...(budgetMin !== undefined ? { gte: budgetMin } : {}), ...(budgetMax !== undefined ? { lte: budgetMax } : {}) };
  }

  const pricePerSqmMax = toNumberOrUndefined(filters.pricePerSqmMax);
  if (pricePerSqmMax !== undefined) where.pricePerSqm = { lte: pricePerSqmMax };

  const surfaceMin = toNumberOrUndefined(filters.surfaceMin);
  const surfaceMax = toNumberOrUndefined(filters.surfaceMax);
  if (surfaceMin !== undefined || surfaceMax !== undefined) {
    where.livingArea = { ...(surfaceMin !== undefined ? { gte: surfaceMin } : {}), ...(surfaceMax !== undefined ? { lte: surfaceMax } : {}) };
  }

  const bedroomsMin = toNumberOrUndefined(filters.bedroomsMin);
  if (bedroomsMin !== undefined) where.bedrooms = { gte: bedroomsMin };
  const bathroomsMin = toNumberOrUndefined(filters.bathroomsMin);
  if (bathroomsMin !== undefined) where.bathrooms = { gte: bathroomsMin };
  const parkingMin = toNumberOrUndefined(filters.parkingMin);
  if (parkingMin !== undefined) where.parkingSpaces = { gte: parkingMin };
  const floor = toNumberOrUndefined(filters.floor);
  if (floor !== undefined) where.floor = floor;

  if (filters.priceOnRequestOnly) where.priceOnRequest = true;
  if (filters.coupDeCoeurOnly) where.isCoupDeCoeur = true;
  if (filters.bonneAffaireOnly) where.isGoodDeal = true;
  if (filters.creditEligible) where.isCreditEligible = true;
  if (filters.mourabahaEligible) where.isMourabahaEligible = true;

  const minYield = toNumberOrUndefined(filters.minYield);
  if (minYield !== undefined) where.estimatedYieldPercent = { gte: minYield };

  // Every "must have this tag" requirement is its own AND clause — writing
  // them all onto a single `where.tags` would let later ones silently
  // overwrite earlier ones instead of combining.
  const requiredTagSlugs = [
    ...(filters.newOnly ? ["nouveau"] : []),
    ...(filters.legalTitled ? ["titre"] : []),
    ...(filters.airbnbAllowed ? ["airbnb-autorise"] : []),
    ...filters.tags,
  ];
  if (requiredTagSlugs.length > 0) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      ...requiredTagSlugs.map((slug) => ({ tags: { some: { slug } } })),
    ];
  }

  // exclusiveOnly / offMarketOnly / developerId / programId / deliveryBefore have no
  // queryable public data source yet (see lib/public-catalog/filters.ts) — left as no-ops.

  return where;
}

function buildOrderBy(sort: PropertyFilterState["sort"]): Prisma.PropertyOrderByWithRelationInput[] {
  switch (sort) {
    case "plus-recent":
      return [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
    case "prix-croissant":
      return [{ price: { sort: "asc", nulls: "last" } }];
    case "prix-decroissant":
      return [{ price: { sort: "desc", nulls: "last" } }];
    case "surface":
      return [{ livingArea: { sort: "desc", nulls: "last" } }];
    case "rendement":
      return [{ estimatedYieldPercent: { sort: "desc", nulls: "last" } }];
    case "pertinence":
    default:
      return [{ isFeatured: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }];
  }
}

export type PublicSearchResult = {
  items: Property[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
};

export async function searchPublicProperties(filters: PropertyFilterState, page: number): Promise<PublicSearchResult> {
  const where = buildWhere(filters);
  const orderBy = buildOrderBy(filters.sort);
  const safePage = Math.max(1, page);

  const [rows, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy,
      select: PUBLIC_PROPERTY_SELECT,
      skip: (safePage - 1) * EXPLORER_PAGE_SIZE,
      take: EXPLORER_PAGE_SIZE,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    items: rows.map(toPublicProperty),
    total,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / EXPLORER_PAGE_SIZE)),
    pageSize: EXPLORER_PAGE_SIZE,
  };
}

// Deduped per request (React cache()) — generateMetadata and the page body
// both look up the same slug.
export const getPublicPropertyBySlug = cache(async (slug: string): Promise<Property | null> => {
  const row = await prisma.property.findFirst({
    where: { slug, publicationStatus: "PUBLIE", visibility: { in: ["PUBLIC", "OFF_MARKET"] } },
    select: PUBLIC_PROPERTY_SELECT,
  });
  return row ? toPublicProperty(row) : null;
});

export async function getFeaturedPublicProperties(count: number): Promise<Property[]> {
  const rows = await prisma.property.findMany({
    where: { ...PUBLIC_BASE_WHERE, isFeatured: true },
    orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: PUBLIC_PROPERTY_SELECT,
    take: count,
  });
  return rows.map(toPublicProperty);
}

export async function getPublicPropertiesForSale(count: number): Promise<Property[]> {
  const rows = await prisma.property.findMany({
    where: { ...PUBLIC_BASE_WHERE, transaction: "VENTE" },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }],
    select: PUBLIC_PROPERTY_SELECT,
    take: count,
  });
  return rows.map(toPublicProperty);
}

export async function getSimilarPublicProperties(current: Property, count: number): Promise<Property[]> {
  const rows = await prisma.property.findMany({
    where: {
      ...PUBLIC_BASE_WHERE,
      id: { not: current.id },
      OR: [{ city: current.location.city }, { propertyType: propertyTypeToDb[current.type] }],
    },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }],
    select: PUBLIC_PROPERTY_SELECT,
    take: count * 3,
  });

  const scored = rows.map((row) => {
    let score = 0;
    if (row.city === current.location.city) score += 2;
    if (propertyTypeToDb[current.type] === row.propertyType) score += 2;
    if (transactionToDb[current.transaction] === row.transaction) score += 1;
    return { row, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((entry) => toPublicProperty(entry.row));
}

export async function getOffMarketPublicProperties(): Promise<Property[]> {
  const rows = await prisma.property.findMany({
    where: { publicationStatus: "PUBLIE", visibility: "OFF_MARKET" },
    orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: PUBLIC_PROPERTY_SELECT,
  });
  return rows.map(toPublicProperty);
}

export async function getPublicCityCounts(): Promise<{ name: string; count: number }[]> {
  const rows = await prisma.property.groupBy({
    by: ["city"],
    where: PUBLIC_BASE_WHERE,
    _count: { _all: true },
    orderBy: { city: "asc" },
  });
  return rows.map((row) => ({ name: row.city, count: row._count._all }));
}

export async function getDistinctPublicPropertyTypes(): Promise<PublicPropertyRow["propertyType"][]> {
  const rows = await prisma.property.findMany({
    where: PUBLIC_BASE_WHERE,
    select: { propertyType: true },
    distinct: ["propertyType"],
    orderBy: { propertyType: "asc" },
  });
  return rows.map((row) => row.propertyType);
}

export async function getPublicDistinctDistricts(): Promise<string[]> {
  const rows = await prisma.property.findMany({
    where: { ...PUBLIC_BASE_WHERE, district: { not: null } },
    select: { district: true },
    distinct: ["district"],
    orderBy: { district: "asc" },
  });
  return rows.map((row) => row.district).filter((district): district is string => Boolean(district));
}

export type PublicSitemapEntry = { slug: string; updatedAt: Date };

export async function getPublicSitemapEntries(): Promise<PublicSitemapEntry[]> {
  return prisma.property.findMany({
    where: PUBLIC_BASE_WHERE,
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}
