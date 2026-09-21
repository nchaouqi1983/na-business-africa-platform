import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Local-disk storage for property documents, deliberately kept outside
 * `public/` — same rationale as lib/media/storage.ts. Lives under its own
 * `documents/{documentId}` subtree of the shared storage/properties root so
 * a documentId can never collide with a mediaId's folder. The only way to
 * read a file back is the authenticated route at
 * app/api/admin/documents/[documentId]/route.ts.
 */

const STORAGE_ROOT = path.join(process.cwd(), "storage", "properties");
const FILENAME = "file.pdf";

export function buildDocumentStorageKey(propertyId: string, documentId: string): string {
  return `${propertyId}/documents/${documentId}`;
}

function documentDir(storageKey: string): string {
  const resolved = path.join(STORAGE_ROOT, storageKey);
  // storageKey is always built from our own cuid-like ids (never user input),
  // but this guards against any future caller passing a raw id straight through.
  if (!resolved.startsWith(STORAGE_ROOT)) {
    throw new Error("Invalid document storage key.");
  }
  return resolved;
}

export async function writeDocumentFile(storageKey: string, buffer: Buffer): Promise<void> {
  const dir = documentDir(storageKey);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, FILENAME), buffer);
}

export async function readDocumentFile(storageKey: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(documentDir(storageKey), FILENAME));
  } catch {
    return null;
  }
}

export async function deleteDocumentFile(storageKey: string): Promise<void> {
  await rm(documentDir(storageKey), { recursive: true, force: true });
}
