import "server-only";
import { prisma } from "@/lib/db";

export async function listPropertyExternalLinks(propertyId: string) {
  return prisma.propertyExternalLink.findMany({
    where: { propertyId },
    orderBy: { sortOrder: "asc" },
  });
}

/** Property ownership fields needed by canEditProperty, plus the reference used in audit logs and visibility for the OFF_MARKET/PRIVE guard. */
export async function getPropertyForLinkAccess(propertyId: string) {
  return prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, reference: true, createdById: true, assignedToId: true, publicationStatus: true, visibility: true },
  });
}

export async function getExternalLinkWithProperty(linkId: string) {
  return prisma.propertyExternalLink.findUnique({
    where: { id: linkId },
    include: {
      property: {
        select: { id: true, reference: true, createdById: true, assignedToId: true, publicationStatus: true, visibility: true },
      },
    },
  });
}

export async function countPropertyExternalLinks(propertyId: string): Promise<number> {
  return prisma.propertyExternalLink.count({ where: { propertyId } });
}
