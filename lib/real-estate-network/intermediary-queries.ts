import "server-only";
import { prisma } from "@/lib/db";
import { Prisma, type IntermediaryType as DbIntermediaryType } from "@/lib/generated/prisma/client";

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
