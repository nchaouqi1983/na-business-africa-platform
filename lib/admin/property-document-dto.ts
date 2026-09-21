import type { PropertyDocument } from "@/lib/generated/prisma/client";

export type PropertyDocumentDto = {
  id: string;
  type: string;
  title: string;
  originalFilename: string;
  sizeBytes: number;
  visibility: string;
  sortOrder: number;
  createdAt: string;
  downloadUrl: string;
};

export function toPropertyDocumentDto(document: PropertyDocument): PropertyDocumentDto {
  return {
    id: document.id,
    type: document.type,
    title: document.title,
    originalFilename: document.originalFilename,
    sizeBytes: document.sizeBytes,
    visibility: document.visibility,
    sortOrder: document.sortOrder,
    createdAt: document.createdAt.toISOString(),
    downloadUrl: `/api/admin/documents/${document.id}`,
  };
}
