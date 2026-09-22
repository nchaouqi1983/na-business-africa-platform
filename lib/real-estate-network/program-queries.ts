import "server-only";
import { prisma } from "@/lib/db";
import { Prisma, type ProgramStatus as DbProgramStatus } from "@/lib/generated/prisma/client";

export const PROGRAM_PAGE_SIZE = 20;

export type ProgramListFilters = {
  q?: string;
  status?: string;
  isActive?: "true" | "false" | "";
  page?: number;
};

export async function listPrograms(filters: ProgramListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where: Prisma.DevelopmentProgramWhereInput = {};

  if (filters.isActive === "true") where.isActive = true;
  else if (filters.isActive === "false") where.isActive = false;
  if (filters.status) where.status = filters.status as DbProgramStatus;

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { promoter: { companyName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.developmentProgram.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PROGRAM_PAGE_SIZE,
      take: PROGRAM_PAGE_SIZE,
      include: { promoter: { select: { id: true, companyName: true } }, _count: { select: { lots: true, properties: true } } },
    }),
    prisma.developmentProgram.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: PROGRAM_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PROGRAM_PAGE_SIZE)),
  };
}

/** Bounded list for the property-linking picker — active programs only. */
export async function searchActivePrograms(q?: string) {
  const needle = q?.trim();
  return prisma.developmentProgram.findMany({
    where: {
      isActive: true,
      ...(needle ? { name: { contains: needle, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
    take: 50,
    include: { promoter: { select: { id: true, companyName: true } } },
  });
}

/**
 * Active programs with their lots embedded — feeds the property "Relations"
 * picker directly (program then lot), no extra round-trip needed once a
 * program is chosen client-side. Bounded to a reasonable admin-scale count.
 */
export async function listActiveProgramsWithLotsForPicker() {
  return prisma.developmentProgram.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    take: 100,
    include: {
      promoter: { select: { id: true, companyName: true } },
      lots: { orderBy: { reference: "asc" }, select: { id: true, reference: true, status: true } },
    },
  });
}

export async function getProgramById(id: string) {
  return prisma.developmentProgram.findUnique({ where: { id } });
}

/** Vue programme : lots, promoteur et biens rattachés. */
export async function getProgramWithLotsAndProperties(id: string) {
  return prisma.developmentProgram.findUnique({
    where: { id },
    include: {
      promoter: { select: { id: true, companyName: true } },
      lots: { orderBy: { reference: "asc" } },
      properties: {
        select: { id: true, reference: true, titleFr: true, status: true, publicationStatus: true, developmentLotId: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
}

/** Lots available for the property-linking picker, scoped to one program. */
export async function listLotsForProgram(programId: string) {
  return prisma.developmentLot.findMany({ where: { programId }, orderBy: { reference: "asc" } });
}

export async function getLotById(id: string) {
  return prisma.developmentLot.findUnique({ where: { id } });
}
