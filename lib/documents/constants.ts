/**
 * Shared, framework-agnostic constants for property documents (phase 6D).
 * PDF-only for this step — kept dependency-free like lib/media/constants.ts
 * so both server code and the client upload form can import from here.
 */

export const MAX_DOCUMENT_FILE_BYTES = 25 * 1024 * 1024; // 25 Mo
export const MAX_DOCUMENTS_PER_PROPERTY = 50;

export const ACCEPTED_DOCUMENT_MIME_TYPES = ["application/pdf"] as const;
export type AcceptedDocumentMimeType = (typeof ACCEPTED_DOCUMENT_MIME_TYPES)[number];

export const ACCEPTED_DOCUMENT_EXTENSIONS = [".pdf"];

export const documentTypeValues = ["BROCHURE", "PLAN", "DOCUMENT_JURIDIQUE", "MANDAT", "AUTRE"] as const;
export type DocumentTypeValue = (typeof documentTypeValues)[number];

export const documentTypeLabels: Record<DocumentTypeValue, string> = {
  BROCHURE: "Brochure",
  PLAN: "Plan",
  DOCUMENT_JURIDIQUE: "Document juridique",
  MANDAT: "Mandat",
  AUTRE: "Autre",
};

/** ADMIN/SUPER_ADMIN only — see canViewPrivateData in lib/property-permissions.ts. */
export const RESTRICTED_DOCUMENT_TYPES: readonly DocumentTypeValue[] = ["DOCUMENT_JURIDIQUE", "MANDAT"];

export function isRestrictedDocumentType(type: DocumentTypeValue): boolean {
  return (RESTRICTED_DOCUMENT_TYPES as readonly string[]).includes(type);
}

export const assetVisibilityValues = ["INTERNE", "PUBLIABLE"] as const;
export type AssetVisibilityValue = (typeof assetVisibilityValues)[number];

export const assetVisibilityLabels: Record<AssetVisibilityValue, string> = {
  INTERNE: "Usage interne",
  PUBLIABLE: "Publiable",
};
