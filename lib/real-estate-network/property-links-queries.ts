import "server-only";
import { prisma } from "@/lib/db";

/**
 * Read layer for a Property's internal "Relations" section (phase 6E).
 * Every caller must gate access itself with canManageRealEstateNetwork(role).
 */

export async function listPropertyOwnerLinks(propertyId: string) {
  return prisma.propertyOwner.findMany({
    where: { propertyId },
    include: { owner: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function listPropertyIntermediaryLinks(propertyId: string) {
  return prisma.propertyIntermediary.findMany({
    where: { propertyId },
    include: { intermediary: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getPropertyDevelopmentLink(propertyId: string) {
  return prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      developmentProgramId: true,
      developmentLotId: true,
      developmentProgram: { select: { id: true, name: true, promoter: { select: { companyName: true } } } },
      developmentLot: { select: { id: true, reference: true, status: true } },
    },
  });
}
