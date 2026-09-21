import "server-only";
import { prisma } from "@/lib/db";
import { RESTRICTED_DOCUMENT_TYPES } from "@/lib/documents/constants";

/**
 * `includeRestricted` must be set from canViewRestrictedDocuments(role) by
 * every caller — never defaulted to true. Filtering happens here (not just
 * in the DTO layer) so a MANDAT/DOCUMENT_JURIDIQUE row never even reaches a
 * response payload for a caller who isn't allowed to see it.
 */
export async function listPropertyDocuments(propertyId: string, includeRestricted: boolean) {
  return prisma.propertyDocument.findMany({
    where: includeRestricted ? { propertyId } : { propertyId, type: { notIn: [...RESTRICTED_DOCUMENT_TYPES] } },
    orderBy: { sortOrder: "asc" },
  });
}

/** Property ownership fields needed by canEditProperty, plus the reference used in audit logs. */
export async function getPropertyForDocumentAccess(propertyId: string) {
  return prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, reference: true, createdById: true, assignedToId: true, publicationStatus: true, visibility: true },
  });
}

export async function getDocumentWithProperty(documentId: string) {
  return prisma.propertyDocument.findUnique({
    where: { id: documentId },
    include: {
      property: {
        select: { id: true, reference: true, createdById: true, assignedToId: true, publicationStatus: true, visibility: true },
      },
    },
  });
}

export async function countPropertyDocuments(propertyId: string): Promise<number> {
  return prisma.propertyDocument.count({ where: { propertyId } });
}
