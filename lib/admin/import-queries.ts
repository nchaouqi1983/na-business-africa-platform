import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

const ROWS_PAGE_SIZE = 50;

export async function listImportBatches() {
  return prisma.propertyImportBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true, email: true } } },
  });
}

export async function getImportBatch(id: string) {
  return prisma.propertyImportBatch.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true, email: true } } },
  });
}

export type ImportRowFilter = "tous" | "valides" | "erreurs" | "importees";

function whereForFilter(batchId: string, filter: ImportRowFilter): Prisma.PropertyImportRowWhereInput {
  switch (filter) {
    case "valides":
      return { batchId, status: "VALIDE" };
    case "erreurs":
      return { batchId, status: "ERREUR" };
    case "importees":
      return { batchId, status: "IMPORTE" };
    case "tous":
    default:
      return { batchId };
  }
}

export async function listImportRows(batchId: string, filter: ImportRowFilter, page: number) {
  const where = whereForFilter(batchId, filter);
  const safePage = Math.max(1, page);

  const [rows, total] = await Promise.all([
    prisma.propertyImportRow.findMany({
      where,
      orderBy: { lineNumber: "asc" },
      skip: (safePage - 1) * ROWS_PAGE_SIZE,
      take: ROWS_PAGE_SIZE,
      include: { property: { select: { id: true, reference: true, slug: true } } },
    }),
    prisma.propertyImportRow.count({ where }),
  ]);

  return { rows, total, pageCount: Math.max(1, Math.ceil(total / ROWS_PAGE_SIZE)), page: safePage };
}
