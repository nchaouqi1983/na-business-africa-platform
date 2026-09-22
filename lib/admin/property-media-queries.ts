import "server-only";
import { prisma } from "@/lib/db";

export async function listPropertyMedia(propertyId: string) {
  return prisma.propertyMedia.findMany({
    where: { propertyId },
    orderBy: { sortOrder: "asc" },
  });
}

/** Property ownership fields needed by canEditProperty, plus the reference used in audit logs. */
export async function getPropertyForMediaAccess(propertyId: string) {
  return prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, slug: true, reference: true, createdById: true, assignedToId: true, publicationStatus: true },
  });
}

export async function getMediaWithProperty(mediaId: string) {
  return prisma.propertyMedia.findUnique({
    where: { id: mediaId },
    include: {
      property: {
        select: { id: true, slug: true, reference: true, createdById: true, assignedToId: true, publicationStatus: true },
      },
    },
  });
}

export async function countPropertyMedia(propertyId: string): Promise<number> {
  return prisma.propertyMedia.count({ where: { propertyId } });
}
