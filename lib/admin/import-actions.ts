"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageImports } from "@/lib/admin/import-permissions";
import { parseCsv, CsvParseError, type ParsedCsv } from "@/lib/admin/csv-parser";
import {
  IMPORT_CSV_COLUMNS,
  REQUIRED_IMPORT_COLUMNS,
  MAX_IMPORT_ROWS,
  validateImportRow,
  buildTagLookup,
  type ValidatedImportRow,
} from "@/lib/admin/import-row-schema";
import { listActiveTags } from "@/lib/admin/property-tags";
import { generateNextPropertyReference } from "@/lib/admin/reference";
import { generateUniquePropertySlug } from "@/lib/admin/slugify";
import { importRowImages } from "@/lib/admin/import-image-import";
import type { PropertyDetailsInput } from "@/lib/admin/property-details-schema";

export type UploadImportFormState = { error: string } | undefined;

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 Mo — largement suffisant pour 500 lignes de ce gabarit.

function generateImportBatchReference(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `IMP-${year}-${random}`;
}

/**
 * Step A — uploads a CSV, parses and validates every row, and persists the
 * batch + one PropertyImportRow per line. Never creates or touches a
 * Property: this is a preview/validation pass only (see runImportBatch for
 * the actual import).
 */
export async function uploadAndValidateImportBatch(
  _prevState: UploadImportFormState,
  formData: FormData
): Promise<UploadImportFormState> {
  const user = await requireAdminUser();
  if (!canManageImports(user.role)) {
    return { error: "Vous n'avez pas le droit d'importer des biens." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Merci de sélectionner un fichier CSV." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Fichier trop volumineux (5 Mo maximum)." };
  }

  const sourceRaw = String(formData.get("source") ?? "");
  if (sourceRaw !== "CAPITAL_PARC" && sourceRaw !== "AUTRE") {
    return { error: "Merci de préciser la source de l'import." };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { error: "Impossible de lire le fichier. Vérifiez qu'il s'agit bien d'un CSV en UTF-8." };
  }

  let parsed: ParsedCsv;
  try {
    parsed = parseCsv(text, IMPORT_CSV_COLUMNS, REQUIRED_IMPORT_COLUMNS);
  } catch (error) {
    if (error instanceof CsvParseError) return { error: error.message };
    throw error;
  }

  if (parsed.rows.length === 0) {
    return { error: "Le fichier ne contient aucune ligne de données." };
  }
  if (parsed.rows.length > MAX_IMPORT_ROWS) {
    return { error: `Trop de lignes (${parsed.rows.length}) — la limite de cette V1 est de ${MAX_IMPORT_ROWS}.` };
  }

  const tags = await listActiveTags();
  const tagLookup = buildTagLookup(tags);

  const perRow = parsed.rows.map(({ lineNumber, values }) => ({
    lineNumber,
    values,
    result: validateImportRow(values, tagLookup),
  }));

  // Duplicate source_external_id *within this same file* — flag every row
  // sharing the id as an error, since there is no reliable way to pick a
  // "correct" one automatically.
  const linesByExternalId = new Map<string, number[]>();
  for (const row of perRow) {
    if (!row.result.ok) continue;
    const key = row.result.data.sourceExternalId;
    const lines = linesByExternalId.get(key) ?? [];
    lines.push(row.lineNumber);
    linesByExternalId.set(key, lines);
  }
  for (const row of perRow) {
    if (!row.result.ok) continue;
    const lines = linesByExternalId.get(row.result.data.sourceExternalId) ?? [];
    if (lines.length > 1) {
      row.result = {
        ok: false,
        errors: [`source_external_id "${row.result.data.sourceExternalId}" en doublon dans ce fichier (lignes ${lines.join(", ")}).`],
      };
    }
  }

  const validCount = perRow.filter((row) => row.result.ok).length;
  const errorCount = perRow.length - validCount;
  const status = validCount > 0 ? "VALIDE" : "ECHEC";
  const coordinatesValidCount = perRow.filter((row) => row.result.ok && row.result.data.hasValidCoordinates).length;

  const batch = await prisma.propertyImportBatch.create({
    data: {
      reference: generateImportBatchReference(),
      fileName: file.name.slice(0, 255),
      source: sourceRaw,
      status,
      rowCount: perRow.length,
      validCount,
      errorCount,
      coordinatesValidCount,
      ignoredColumns: parsed.ignoredColumns.length > 0 ? (parsed.ignoredColumns as Prisma.InputJsonValue) : undefined,
      createdById: user.id,
      rows: {
        create: perRow.map((row) => ({
          lineNumber: row.lineNumber,
          sourceData: row.values as Prisma.InputJsonValue,
          status: row.result.ok ? "VALIDE" : "ERREUR",
          errors: row.result.ok ? undefined : (row.result.errors as Prisma.InputJsonValue),
        })),
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "IMPORT_BATCH_UPLOADED",
      entity: "PropertyImportBatch",
      entityId: batch.id,
      metadata: {
        reference: batch.reference,
        rowCount: perRow.length,
        validCount,
        errorCount,
        status,
        coordinatesValidCount,
        ignoredColumns: parsed.ignoredColumns,
      },
    },
  });

  revalidatePath("/admin/imports");
  redirect(`/admin/imports/${batch.id}`);
}

function toPlainJson(value: PropertyDetailsInput): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Public, importable fields shared by both the create and update path of
 * runImportBatch — never includes publicationStatus, reference, slug (on
 * update), assignment, media, documents, PropertyPrivate or any CRM/finance
 * data. Covers ~80% of a bien's public fields as of phase 6J2 — everything
 * that has a real column in the Property model and a matching CSV column.
 */
function importableFields(data: ValidatedImportRow) {
  return {
    titleFr: data.titleFr,
    shortDescription: data.shortDescription,
    descriptionFr: data.descriptionFr,
    transaction: data.transaction,
    propertyType: data.propertyType,
    propertySubtype: data.propertySubtype,
    status: data.status,
    visibility: data.visibility,
    isFeatured: data.isFeatured,
    isGoodDeal: data.isGoodDeal,
    isCoupDeCoeur: data.isCoupDeCoeur,
    isExclusive: data.isExclusive,

    city: data.city,
    district: data.district,
    addressPublic: data.addressPublic,
    latitude: data.latitude,
    longitude: data.longitude,
    proximityNotes: data.proximityNotes,

    currency: data.currency,
    price: data.price,
    priceOnRequest: data.priceOnRequest,
    pricePerSqm: data.pricePerSqm,
    negotiable: data.negotiable,
    agencyFeePercent: data.agencyFeePercent,
    estimatedYieldPercent: data.estimatedYieldPercent,

    livingArea: data.livingArea,
    builtArea: data.builtArea,
    landArea: data.landArea,
    terraceArea: data.terraceArea,
    balconyArea: data.balconyArea,
    basementArea: data.basementArea,

    bedrooms: data.bedrooms,
    suites: data.suites,
    bathrooms: data.bathrooms,
    salons: data.salons,
    kitchens: data.kitchens,
    parkingSpaces: data.parkingSpaces,
    totalFloors: data.totalFloors,
    yearBuilt: data.yearBuilt,

    condition: data.condition,
    furnished: data.furnished,
    orientation: data.orientation,
    availability: data.availability,

    details: toPlainJson(data.details),
  };
}

/**
 * Step B — imports the rows that were found VALIDE by step A. Guarded
 * against double-click/double-run by an atomic conditional update: only the
 * request that actually flips status VALIDE -> IMPORTE proceeds, so a
 * duplicate submit for the same batch is a no-op that redirects with a
 * friendly notice instead of importing twice.
 *
 * Each row is processed in its own transaction — one row's failure never
 * rolls back rows already imported (robustness requirement, phase 6J1 §6).
 */
export async function runImportBatch(batchId: string): Promise<void> {
  const user = await requireAdminUser();
  if (!canManageImports(user.role)) {
    redirect(`/admin/imports/${batchId}?erreur=permission`);
  }

  const batch = await prisma.propertyImportBatch.findUnique({ where: { id: batchId } });
  if (!batch) redirect("/admin/imports");

  const claim = await prisma.propertyImportBatch.updateMany({
    where: { id: batchId, status: "VALIDE" },
    data: { status: "IMPORTE", importedAt: new Date() },
  });
  if (claim.count === 0) {
    redirect(`/admin/imports/${batchId}?erreur=deja-importe`);
  }

  const tags = await listActiveTags();
  const tagLookup = buildTagLookup(tags);

  const rows = await prisma.propertyImportRow.findMany({
    where: { batchId, status: "VALIDE" },
    orderBy: { lineNumber: "asc" },
  });

  let createdCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  let imagesDownloadedCount = 0;
  let imagesRejectedCount = 0;

  for (const row of rows) {
    const raw = row.sourceData as Record<string, string>;
    // Re-validated rather than trusted as-is: nothing should have changed
    // since step A, but a tag could have been deactivated in the meantime —
    // fail that single row rather than crash the whole run.
    const result = validateImportRow(raw, tagLookup);

    if (!result.ok) {
      failedCount += 1;
      await prisma.propertyImportRow.update({
        where: { id: row.id },
        data: { status: "ERREUR", errors: result.errors as Prisma.InputJsonValue },
      });
      continue;
    }

    try {
      const outcome = await prisma.$transaction(async (tx) => {
        const existing = await tx.property.findUnique({
          where: { importSource_sourceExternalId: { importSource: batch.source, sourceExternalId: result.data.sourceExternalId } },
        });

        if (existing) {
          await tx.property.update({
            where: { id: existing.id },
            data: {
              ...importableFields(result.data),
              updatedById: user.id,
              tags: { set: result.data.tagSlugs.map((slug) => ({ slug })) },
            },
          });
          await tx.propertyImportRow.update({
            where: { id: row.id },
            data: { status: "IMPORTE", isUpdate: true, propertyId: existing.id, errors: Prisma.JsonNull },
          });
          return { isUpdate: true as const, propertyId: existing.id };
        }

        const reference = await generateNextPropertyReference();
        const slug = await generateUniquePropertySlug(result.data.titleFr);
        const created = await tx.property.create({
          data: {
            reference,
            slug,
            ...importableFields(result.data),
            // Hardcoded regardless of anything the CSV requests — new
            // imported biens always start as a draft (phase 6J1 §5B).
            publicationStatus: "BROUILLON",
            importSource: batch.source,
            sourceExternalId: result.data.sourceExternalId,
            createdById: user.id,
            updatedById: user.id,
            tags: { connect: result.data.tagSlugs.map((slug) => ({ slug })) },
          },
        });
        await tx.propertyImportRow.update({
          where: { id: row.id },
          data: { status: "IMPORTE", isUpdate: false, propertyId: created.id, errors: Prisma.JsonNull },
        });
        return { isUpdate: false as const, propertyId: created.id };
      });

      if (outcome.isUpdate) {
        updatedCount += 1;
      } else {
        createdCount += 1;
      }

      // Images are downloaded/stored to local disk after the DB write
      // commits — file writes aren't transactional, same reasoning as the
      // manual upload path in lib/admin/property-media-actions.ts. A failed
      // or rejected image only affects itself, never the bien.
      if (result.data.imageUrls.length > 0) {
        const imageOutcome = await importRowImages(outcome.propertyId, user.id, result.data.imageUrls);
        imagesDownloadedCount += imageOutcome.downloaded;
        imagesRejectedCount += imageOutcome.rejected;
        if (imageOutcome.errors.length > 0 || imageOutcome.downloaded > 0) {
          await prisma.propertyImportRow.update({
            where: { id: row.id },
            data: {
              imagesImportedCount: imageOutcome.downloaded,
              imageErrors: imageOutcome.errors.length > 0 ? (imageOutcome.errors as Prisma.InputJsonValue) : undefined,
            },
          });
        }
      }
    } catch {
      failedCount += 1;
      await prisma.propertyImportRow.update({
        where: { id: row.id },
        data: { status: "ERREUR", errors: ["Échec technique lors de la création/mise à jour du bien."] as Prisma.InputJsonValue },
      });
    }
  }

  await prisma.propertyImportBatch.update({
    where: { id: batchId },
    data: {
      createdCount,
      updatedCount,
      errorCount: batch.errorCount + failedCount,
      imagesDownloadedCount,
      imagesRejectedCount,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "IMPORT_BATCH_IMPORTED",
      entity: "PropertyImportBatch",
      entityId: batchId,
      metadata: {
        reference: batch.reference,
        created: createdCount,
        updated: updatedCount,
        failed: failedCount,
        processed: rows.length,
        imagesDownloaded: imagesDownloadedCount,
        imagesRejected: imagesRejectedCount,
      },
    },
  });

  revalidatePath(`/admin/imports/${batchId}`);
  revalidatePath("/admin/imports");
  revalidatePath("/admin/biens");
  redirect(`/admin/imports/${batchId}`);
}
