import "server-only";
import { prisma } from "@/lib/db";
import { MAX_ORIGINAL_FILE_BYTES, MAX_PHOTOS_PER_PROPERTY } from "@/lib/media/constants";
import {
  decodeImage,
  generateVariants,
  mimeTypeForSniffedFormat,
  extensionForSniffedFormat,
  sniffImageFormat,
} from "@/lib/media/image-processing";
import { buildStorageKey, deleteMediaFiles, writeMediaFiles } from "@/lib/media/storage";
import { sha256Hex } from "@/lib/media/hash";
import { fetchImageBytes } from "@/lib/admin/import-image-fetch";

export type ImportImagesOutcome = {
  downloaded: number;
  rejected: number;
  errors: string[];
};

/**
 * Downloads and stores `image_urls` for one imported/updated bien, reusing
 * the exact same decode/variant/storage pipeline as a manual upload
 * (lib/media/*) — see lib/admin/import-image-fetch.ts for the SSRF-hardened
 * download itself. Runs strictly after the Property row already exists;
 * never part of the property's own DB transaction (file writes aren't
 * transactional, matching lib/admin/property-media-actions.ts's pattern).
 * A single bad URL only rejects that one image — it never fails the bien or
 * the other URLs in the same row.
 */
export async function importRowImages(propertyId: string, uploadedById: string, urls: string[]): Promise<ImportImagesOutcome> {
  const errors: string[] = [];
  let downloaded = 0;
  let rejected = 0;

  if (urls.length === 0) return { downloaded, rejected, errors };

  let existingCount = await prisma.propertyMedia.count({ where: { propertyId } });

  const capped = urls.slice(0, MAX_PHOTOS_PER_PROPERTY);
  const overflow = urls.length - capped.length;
  if (overflow > 0) {
    rejected += overflow;
    errors.push(`${overflow} image(s) ignorée(s) : maximum ${MAX_PHOTOS_PER_PROPERTY} URLs par ligne.`);
  }

  for (const [index, url] of capped.entries()) {
    if (existingCount >= MAX_PHOTOS_PER_PROPERTY) {
      rejected += 1;
      errors.push(`image ${index + 1} (${url}) : limite de ${MAX_PHOTOS_PER_PROPERTY} photos atteinte pour ce bien.`);
      continue;
    }

    const fetched = await fetchImageBytes(url, MAX_ORIGINAL_FILE_BYTES);
    if (!fetched.ok) {
      rejected += 1;
      errors.push(`image ${index + 1} (${url}) : ${fetched.reason}.`);
      continue;
    }

    const sniffed = sniffImageFormat(fetched.buffer);
    if (!sniffed) {
      rejected += 1;
      errors.push(`image ${index + 1} (${url}) : format non reconnu (JPEG, PNG ou WebP uniquement).`);
      continue;
    }

    let dimensions: { width: number; height: number };
    let variants: Awaited<ReturnType<typeof generateVariants>>;
    try {
      dimensions = await decodeImage(fetched.buffer);
      variants = await generateVariants(fetched.buffer);
    } catch {
      rejected += 1;
      errors.push(`image ${index + 1} (${url}) : image corrompue ou illisible.`);
      continue;
    }

    const checksum = sha256Hex(fetched.buffer);
    const duplicate = await prisma.propertyMedia.findUnique({
      where: { propertyId_checksum: { propertyId, checksum } },
    });
    if (duplicate) {
      // Already present from a previous run of this same import — silently
      // skipped, not an error: re-running an import must stay idempotent.
      continue;
    }

    const mediaId = crypto.randomUUID();
    const storageKey = buildStorageKey(propertyId, mediaId);
    const isCover = existingCount === 0;

    await writeMediaFiles(storageKey, { buffer: fetched.buffer, extension: extensionForSniffedFormat(sniffed) }, variants);

    try {
      await prisma.propertyMedia.create({
        data: {
          id: mediaId,
          propertyId,
          originalFilename: (url.split("/").pop() || "image").slice(0, 255),
          mimeType: mimeTypeForSniffedFormat(sniffed),
          sizeBytes: fetched.buffer.length,
          width: dimensions.width,
          height: dimensions.height,
          checksum,
          storageKey,
          sortOrder: existingCount,
          isCover,
          uploadedById,
        },
      });
      existingCount += 1;
      downloaded += 1;
    } catch {
      await deleteMediaFiles(storageKey);
      rejected += 1;
      errors.push(`image ${index + 1} (${url}) : échec technique lors de l'enregistrement.`);
    }
  }

  return { downloaded, rejected, errors };
}
