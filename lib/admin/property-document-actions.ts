import "server-only";
import { prisma } from "@/lib/db";
import type { AuthenticatedUser } from "@/lib/auth/dal";
import { canEditProperty, canViewRestrictedDocuments } from "@/lib/property-permissions";
import {
  getDocumentWithProperty,
  getPropertyForDocumentAccess,
  countPropertyDocuments,
} from "@/lib/admin/property-document-queries";
import {
  uploadDocumentMetaSchema,
  patchDocumentSchema,
  reorderDocumentsSchema,
  type PatchDocumentInput,
} from "@/lib/admin/property-document-schema";
import { MAX_DOCUMENT_FILE_BYTES, MAX_DOCUMENTS_PER_PROPERTY, isRestrictedDocumentType, type DocumentTypeValue } from "@/lib/documents/constants";
import { sniffIsPdf } from "@/lib/documents/sniff";
import { buildDocumentStorageKey, deleteDocumentFile, writeDocumentFile } from "@/lib/documents/storage";

export type DocumentActionErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "LIMIT_REACHED"
  | "TOO_LARGE"
  | "UNSUPPORTED_TYPE"
  | "BAD_REQUEST";

const STATUS_BY_CODE: Record<DocumentActionErrorCode, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  LIMIT_REACHED: 409,
  TOO_LARGE: 413,
  UNSUPPORTED_TYPE: 415,
  BAD_REQUEST: 400,
};

export class DocumentActionError extends Error {
  code: DocumentActionErrorCode;
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(code: DocumentActionErrorCode, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.fieldErrors = fieldErrors;
  }
}

async function assertCanEditProperty(user: AuthenticatedUser, propertyId: string) {
  const property = await getPropertyForDocumentAccess(propertyId);
  if (!property) throw new DocumentActionError("NOT_FOUND", "Bien introuvable.");
  if (!canEditProperty(user.role, user.id, property)) {
    throw new DocumentActionError("FORBIDDEN", "Vous n'avez pas le droit de modifier les documents de ce bien.");
  }
  return property;
}

/** Refuses to expose or manage a MANDAT/DOCUMENT_JURIDIQUE row to a role that can't view restricted documents. */
function assertCanManageType(user: AuthenticatedUser, type: DocumentTypeValue) {
  if (isRestrictedDocumentType(type) && !canViewRestrictedDocuments(user.role)) {
    throw new DocumentActionError("FORBIDDEN", "Ce type de document est réservé aux administrateurs.");
  }
}

/** OFF_MARKET/PRIVE biens never get a publiable document — enforced server-side regardless of what the form sent. */
function resolveVisibility(propertyVisibility: string, requested: "INTERNE" | "PUBLIABLE") {
  if (propertyVisibility === "OFF_MARKET" || propertyVisibility === "PRIVE") return "INTERNE" as const;
  return requested;
}

export async function addPropertyDocument(
  user: AuthenticatedUser,
  propertyId: string,
  file: File,
  rawMeta: unknown
) {
  const property = await assertCanEditProperty(user, propertyId);

  const parsed = uploadDocumentMetaSchema.safeParse(rawMeta);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new DocumentActionError("BAD_REQUEST", issue?.message ?? "Requête invalide.", {
      [String(issue?.path[0] ?? "type")]: issue?.message ?? "Invalide.",
    });
  }
  const meta = parsed.data;
  assertCanManageType(user, meta.type);

  if (file.size <= 0) {
    throw new DocumentActionError("BAD_REQUEST", "Fichier vide.");
  }
  if (file.size > MAX_DOCUMENT_FILE_BYTES) {
    throw new DocumentActionError("TOO_LARGE", "Fichier trop volumineux (25 Mo maximum).");
  }

  const existingCount = await countPropertyDocuments(propertyId);
  if (existingCount >= MAX_DOCUMENTS_PER_PROPERTY) {
    throw new DocumentActionError("LIMIT_REACHED", `Limite de ${MAX_DOCUMENTS_PER_PROPERTY} documents atteinte pour ce bien.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!sniffIsPdf(buffer)) {
    throw new DocumentActionError("UNSUPPORTED_TYPE", "Seuls les fichiers PDF sont acceptés à cette étape.");
  }

  const documentId = crypto.randomUUID();
  const storageKey = buildDocumentStorageKey(propertyId, documentId);
  const nextSortOrder = existingCount;
  const visibility = resolveVisibility(property.visibility, meta.visibility);

  await writeDocumentFile(storageKey, buffer);

  try {
    const document = await prisma.propertyDocument.create({
      data: {
        id: documentId,
        propertyId,
        type: meta.type,
        title: meta.title,
        originalFilename: file.name.slice(0, 255),
        mimeType: "application/pdf",
        sizeBytes: file.size,
        storageKey,
        visibility,
        sortOrder: nextSortOrder,
        uploadedById: user.id,
      },
    });

    // Never log the filename or the title — a mandat's title can itself be
    // identifying data, per the "AuditLog sans nom de fichier ni données
    // privées" requirement.
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PROPERTY_DOCUMENT_ADDED",
        entity: "Property",
        entityId: propertyId,
        metadata: { reference: property.reference, documentId, type: meta.type },
      },
    });

    return document;
  } catch (error) {
    await deleteDocumentFile(storageKey);
    throw error;
  }
}

export async function updatePropertyDocument(user: AuthenticatedUser, documentId: string, rawPatch: unknown) {
  const document = await getDocumentWithProperty(documentId);
  if (!document) throw new DocumentActionError("NOT_FOUND", "Document introuvable.");
  if (!canEditProperty(user.role, user.id, document.property)) {
    throw new DocumentActionError("FORBIDDEN", "Vous n'avez pas le droit de modifier les documents de ce bien.");
  }
  assertCanManageType(user, document.type as DocumentTypeValue);

  const parsed = patchDocumentSchema.safeParse(rawPatch);
  if (!parsed.success) {
    throw new DocumentActionError("BAD_REQUEST", "Requête invalide.", { title: parsed.error.issues[0]?.message ?? "Invalide." });
  }
  const patch: PatchDocumentInput = parsed.data;
  if (patch.type) assertCanManageType(user, patch.type);

  const visibility =
    patch.visibility !== undefined ? resolveVisibility(document.property.visibility, patch.visibility) : undefined;

  const updated = await prisma.propertyDocument.update({
    where: { id: documentId },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(visibility !== undefined ? { visibility } : {}),
    },
  });

  return updated;
}

export async function deletePropertyDocument(user: AuthenticatedUser, documentId: string) {
  const document = await getDocumentWithProperty(documentId);
  if (!document) throw new DocumentActionError("NOT_FOUND", "Document introuvable.");
  if (!canEditProperty(user.role, user.id, document.property)) {
    throw new DocumentActionError("FORBIDDEN", "Vous n'avez pas le droit de modifier les documents de ce bien.");
  }
  assertCanManageType(user, document.type as DocumentTypeValue);

  await prisma.propertyDocument.delete({ where: { id: documentId } });
  await deleteDocumentFile(document.storageKey);

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PROPERTY_DOCUMENT_REMOVED",
      entity: "Property",
      entityId: document.propertyId,
      metadata: { reference: document.property.reference, documentId, type: document.type },
    },
  });
}

export async function reorderPropertyDocuments(user: AuthenticatedUser, propertyId: string, rawBody: unknown) {
  const property = await assertCanEditProperty(user, propertyId);

  const parsed = reorderDocumentsSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new DocumentActionError("BAD_REQUEST", "Requête invalide.");
  }
  const { order } = parsed.data;

  // Only reorders documents this role is allowed to see, so an
  // AGENT/EDITOR's client-side list (which never included MANDAT/
  // DOCUMENT_JURIDIQUE rows) can't accidentally drop or reorder those rows.
  const visible = await prisma.propertyDocument.findMany({
    where: canViewRestrictedDocuments(user.role)
      ? { propertyId }
      : { propertyId, type: { notIn: ["DOCUMENT_JURIDIQUE", "MANDAT"] } },
    select: { id: true },
  });
  const visibleIds = new Set(visible.map((row) => row.id));
  const isValidPermutation = order.length === visibleIds.size && order.every((id) => visibleIds.has(id));
  if (!isValidPermutation) {
    throw new DocumentActionError("BAD_REQUEST", "L'ordre fourni ne correspond pas aux documents visibles.");
  }

  await prisma.$transaction(order.map((id, index) => prisma.propertyDocument.update({ where: { id }, data: { sortOrder: index } })));

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PROPERTY_DOCUMENT_REORDERED",
      entity: "Property",
      entityId: propertyId,
      metadata: { reference: property.reference, documentCount: order.length },
    },
  });
}
