import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import type { AuthenticatedUser } from "@/lib/auth/dal";
import { canEditProperty } from "@/lib/property-permissions";
import {
  getMediaWithProperty,
  getPropertyForMediaAccess,
  countPropertyMedia,
} from "@/lib/admin/property-media-queries";
import { patchMediaSchema, reorderMediaSchema, type PatchMediaInput } from "@/lib/admin/property-media-schema";
import { MAX_ORIGINAL_FILE_BYTES, MAX_PHOTOS_PER_PROPERTY, type MediaVariant } from "@/lib/media/constants";
import { decodeImage, generateVariants, mimeTypeForSniffedFormat, extensionForSniffedFormat, sniffImageFormat } from "@/lib/media/image-processing";
import { buildStorageKey, deleteMediaFiles, writeMediaFiles } from "@/lib/media/storage";
import { sha256Hex } from "@/lib/media/hash";

export type MediaActionErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "LIMIT_REACHED"
  | "TOO_LARGE"
  | "UNSUPPORTED_TYPE"
  | "CORRUPTED"
  | "DUPLICATE"
  | "BAD_REQUEST";

const STATUS_BY_CODE: Record<MediaActionErrorCode, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  LIMIT_REACHED: 409,
  TOO_LARGE: 413,
  UNSUPPORTED_TYPE: 415,
  CORRUPTED: 422,
  DUPLICATE: 409,
  BAD_REQUEST: 400,
};

export class MediaActionError extends Error {
  code: MediaActionErrorCode;
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(code: MediaActionErrorCode, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.fieldErrors = fieldErrors;
  }
}

async function assertCanEditProperty(user: AuthenticatedUser, propertyId: string) {
  const property = await getPropertyForMediaAccess(propertyId);
  if (!property) throw new MediaActionError("NOT_FOUND", "Bien introuvable.");
  if (!canEditProperty(user.role, user.id, property)) {
    throw new MediaActionError("FORBIDDEN", "Vous n'avez pas le droit de modifier les médias de ce bien.");
  }
  return property;
}

export async function addPropertyMedia(user: AuthenticatedUser, propertyId: string, file: File, altText?: string) {
  const property = await assertCanEditProperty(user, propertyId);

  if (file.size <= 0) {
    throw new MediaActionError("BAD_REQUEST", "Fichier vide.");
  }
  if (file.size > MAX_ORIGINAL_FILE_BYTES) {
    throw new MediaActionError("TOO_LARGE", "Image trop volumineuse (25 Mo maximum).");
  }

  const existingCount = await countPropertyMedia(propertyId);
  if (existingCount >= MAX_PHOTOS_PER_PROPERTY) {
    throw new MediaActionError("LIMIT_REACHED", `Limite de ${MAX_PHOTOS_PER_PROPERTY} photos atteinte pour ce bien.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const sniffed = sniffImageFormat(buffer);
  if (!sniffed) {
    throw new MediaActionError("UNSUPPORTED_TYPE", "Format non supporté (JPEG, PNG ou WebP uniquement).");
  }

  let dimensions: { width: number; height: number };
  let variants: Record<MediaVariant, Buffer>;
  try {
    dimensions = await decodeImage(buffer);
    variants = await generateVariants(buffer);
  } catch {
    throw new MediaActionError("CORRUPTED", "Image illisible ou corrompue.");
  }

  const checksum = sha256Hex(buffer);
  const duplicate = await prisma.propertyMedia.findUnique({
    where: { propertyId_checksum: { propertyId, checksum } },
  });
  if (duplicate) {
    throw new MediaActionError("DUPLICATE", "Cette image a déjà été ajoutée à ce bien.");
  }

  const mediaId = crypto.randomUUID();
  const storageKey = buildStorageKey(propertyId, mediaId);
  const nextSortOrder = existingCount;
  const isCover = existingCount === 0;

  await writeMediaFiles(storageKey, { buffer, extension: extensionForSniffedFormat(sniffed) }, variants);

  try {
    const media = await prisma.propertyMedia.create({
      data: {
        id: mediaId,
        propertyId,
        originalFilename: file.name.slice(0, 255),
        mimeType: mimeTypeForSniffedFormat(sniffed),
        sizeBytes: file.size,
        width: dimensions.width,
        height: dimensions.height,
        checksum,
        storageKey,
        sortOrder: nextSortOrder,
        isCover,
        altText: altText?.trim() ? altText.trim().slice(0, 300) : null,
        uploadedById: user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PROPERTY_MEDIA_ADDED",
        entity: "Property",
        entityId: propertyId,
        metadata: { reference: property.reference, mediaId },
      },
    });

    return media;
  } catch (error) {
    await deleteMediaFiles(storageKey);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new MediaActionError("DUPLICATE", "Cette image a déjà été ajoutée à ce bien.");
    }
    throw error;
  }
}

export async function updatePropertyMedia(user: AuthenticatedUser, mediaId: string, rawPatch: unknown) {
  const media = await getMediaWithProperty(mediaId);
  if (!media) throw new MediaActionError("NOT_FOUND", "Média introuvable.");
  if (!canEditProperty(user.role, user.id, media.property)) {
    throw new MediaActionError("FORBIDDEN", "Vous n'avez pas le droit de modifier les médias de ce bien.");
  }

  const parsed = patchMediaSchema.safeParse(rawPatch);
  if (!parsed.success) {
    throw new MediaActionError("BAD_REQUEST", "Requête invalide.", { altText: parsed.error.issues[0]?.message ?? "Invalide." });
  }
  const patch: PatchMediaInput = parsed.data;

  const becomesCover = patch.isCover === true && !media.isCover;

  const updated = await prisma.$transaction(async (tx) => {
    if (becomesCover) {
      await tx.propertyMedia.updateMany({
        where: { propertyId: media.propertyId, isCover: true },
        data: { isCover: false },
      });
    }

    return tx.propertyMedia.update({
      where: { id: mediaId },
      data: {
        ...(patch.altText !== undefined ? { altText: patch.altText?.trim() || null } : {}),
        ...(patch.isCover !== undefined ? { isCover: patch.isCover } : {}),
      },
    });
  });

  if (becomesCover) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PROPERTY_MEDIA_COVER_CHANGED",
        entity: "Property",
        entityId: media.propertyId,
        metadata: { reference: media.property.reference, mediaId },
      },
    });
  }

  return updated;
}

export async function deletePropertyMedia(user: AuthenticatedUser, mediaId: string) {
  const media = await getMediaWithProperty(mediaId);
  if (!media) throw new MediaActionError("NOT_FOUND", "Média introuvable.");
  if (!canEditProperty(user.role, user.id, media.property)) {
    throw new MediaActionError("FORBIDDEN", "Vous n'avez pas le droit de modifier les médias de ce bien.");
  }

  await prisma.propertyMedia.delete({ where: { id: mediaId } });
  await deleteMediaFiles(media.storageKey);

  if (media.isCover) {
    const next = await prisma.propertyMedia.findFirst({
      where: { propertyId: media.propertyId },
      orderBy: { sortOrder: "asc" },
    });
    if (next) {
      await prisma.propertyMedia.update({ where: { id: next.id }, data: { isCover: true } });
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PROPERTY_MEDIA_REMOVED",
      entity: "Property",
      entityId: media.propertyId,
      metadata: { reference: media.property.reference, mediaId },
    },
  });
}

export async function reorderPropertyMedia(user: AuthenticatedUser, propertyId: string, rawBody: unknown) {
  const property = await assertCanEditProperty(user, propertyId);

  const parsed = reorderMediaSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new MediaActionError("BAD_REQUEST", "Requête invalide.");
  }
  const { order } = parsed.data;

  const existing = await prisma.propertyMedia.findMany({ where: { propertyId }, select: { id: true } });
  const existingIds = new Set(existing.map((row) => row.id));
  const isValidPermutation = order.length === existingIds.size && order.every((id) => existingIds.has(id));
  if (!isValidPermutation) {
    throw new MediaActionError("BAD_REQUEST", "L'ordre fourni ne correspond pas aux médias existants.");
  }

  await prisma.$transaction(order.map((id, index) => prisma.propertyMedia.update({ where: { id }, data: { sortOrder: index } })));

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PROPERTY_MEDIA_REORDERED",
      entity: "Property",
      entityId: propertyId,
      metadata: { reference: property.reference, mediaCount: order.length },
    },
  });
}
