import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { MEDIA_VARIANTS, type MediaVariant } from "@/lib/media/constants";

/**
 * Local-disk storage for property media, deliberately kept outside `public/`
 * so nothing under it is ever reachable by a direct static URL — the only
 * way to read a variant is the authenticated route at
 * app/api/admin/media/[mediaId]/[variant]/route.ts.
 *
 * Every helper here is keyed by `storageKey` (== `${propertyId}/${mediaId}`)
 * rather than by raw ids, so a future migration to Cloudflare R2/Images only
 * has to swap this file's implementation for one that shells out to the R2
 * SDK using the same storageKey as the object key prefix — no caller change.
 */

const STORAGE_ROOT = path.join(process.cwd(), "storage", "properties");

export function buildStorageKey(propertyId: string, mediaId: string): string {
  return `${propertyId}/${mediaId}`;
}

function mediaDir(storageKey: string): string {
  const resolved = path.join(STORAGE_ROOT, storageKey);
  // storageKey is always built from our own cuid-like ids (never user input),
  // but this guards against any future caller passing a raw id straight through.
  if (!resolved.startsWith(STORAGE_ROOT)) {
    throw new Error("Invalid media storage key.");
  }
  return resolved;
}

function masterFilename(extension: string): string {
  return `master${extension}`;
}

function variantFilename(variant: MediaVariant): string {
  return `${variant}.webp`;
}

export async function writeMediaFiles(
  storageKey: string,
  master: { buffer: Buffer; extension: string },
  variants: Record<MediaVariant, Buffer>
): Promise<void> {
  const dir = mediaDir(storageKey);
  await mkdir(dir, { recursive: true });

  await writeFile(path.join(dir, masterFilename(master.extension)), master.buffer);
  for (const variant of MEDIA_VARIANTS) {
    await writeFile(path.join(dir, variantFilename(variant)), variants[variant]);
  }
}

export async function readMediaVariant(storageKey: string, variant: MediaVariant): Promise<Buffer | null> {
  try {
    return await readFile(path.join(mediaDir(storageKey), variantFilename(variant)));
  } catch {
    return null;
  }
}

export async function deleteMediaFiles(storageKey: string): Promise<void> {
  await rm(mediaDir(storageKey), { recursive: true, force: true });
}
