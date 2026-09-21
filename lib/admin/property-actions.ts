"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  Prisma,
  type Visibility as DbVisibility,
  type PropertyPrivate as PropertyPrivateRow,
} from "@/lib/generated/prisma/client";
import { requireAdminUser } from "@/lib/auth/dal";
import {
  canArchiveProperty,
  canCreateProperty,
  canEditProperty,
  canManageTags,
  canPublishProperty,
  canViewPrivateData,
} from "@/lib/property-permissions";
import { propertyTypeGroup, tagTaxonomy, type TagCategory } from "@/lib/property-schema";
import {
  parsePropertyDossierForm,
  parsePropertyPrivateForm,
  type PropertyDossierInput,
  type PropertyPrivateInput,
} from "@/lib/admin/property-dossier-schema";
import {
  detailsSchemaForGroup,
  extractDetailsFormValues,
  type PropertyDetailsInput,
} from "@/lib/admin/property-details-schema";
import {
  transactionToDb,
  transactionFromDb,
  propertyTypeToDb,
  propertyTypeFromDb,
  propertyStatusToDb,
  propertyStatusFromDb,
  conditionToDb,
  conditionFromDb,
  furnishedToDb,
  furnishedFromDb,
  orientationToDb,
  orientationFromDb,
  tagCategoryToDb,
} from "@/lib/admin/property-enum-maps";
import { generateUniquePropertySlug, slugify } from "@/lib/admin/slugify";
import { generateNextPropertyReference } from "@/lib/admin/reference";
import { resolveExistingActiveTagSlugs } from "@/lib/admin/property-tags";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";

export type PropertyFormState =
  | {
      error: string;
      fieldErrors?: Record<string, string>;
    }
  | undefined;

export type TagFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
      tag?: { slug: string; labelFr: string; category: TagCategory };
    }
  | undefined;

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function toPlainJson(value: PropertyDetailsInput): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function dossierToPropertyData(data: PropertyDossierInput, details: PropertyDetailsInput) {
  return {
    titleFr: data.titleFr,
    shortDescription: data.shortDescription ?? null,
    descriptionFr: data.descriptionFr ?? null,
    transaction: transactionToDb[data.transaction],
    propertyType: propertyTypeToDb[data.propertyType],
    propertySubtype: data.propertySubtype ?? null,
    status: propertyStatusToDb[data.status],
    visibility: data.visibility as DbVisibility,
    isFeatured: data.isFeatured,
    isGoodDeal: data.isGoodDeal,
    isCoupDeCoeur: data.isCoupDeCoeur,

    city: data.city,
    district: data.district ?? null,
    addressPublic: data.addressPublic ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    proximityNotes: data.proximityNotes ?? null,

    price: data.price ?? null,
    priceOnRequest: data.priceOnRequest,
    pricePerSqm: data.pricePerSqm ?? null,
    negotiable: data.negotiable,
    agencyFeePercent: data.agencyFeePercent ?? null,
    monthlyCharges: data.monthlyCharges ?? null,
    securityDeposit: data.securityDeposit ?? null,
    estimatedYieldPercent: data.estimatedYieldPercent ?? null,
    isCreditEligible: data.isCreditEligible,
    isMourabahaEligible: data.isMourabahaEligible,

    livingArea: data.livingArea ?? null,
    builtArea: data.builtArea ?? null,
    landArea: data.landArea ?? null,
    terraceArea: data.terraceArea ?? null,
    balconyArea: data.balconyArea ?? null,
    basementArea: data.basementArea ?? null,
    bedrooms: data.bedrooms ?? null,
    suites: data.suites ?? null,
    bathrooms: data.bathrooms ?? null,
    salons: data.salons ?? null,
    kitchens: data.kitchens ?? null,
    parkingSpaces: data.parkingSpaces ?? null,
    floor: data.floor ?? null,
    totalFloors: data.totalFloors ?? null,
    yearBuilt: data.yearBuilt ?? null,
    condition: data.condition ? conditionToDb[data.condition] : null,
    furnished: data.furnished ? furnishedToDb[data.furnished] : null,
    orientation: data.orientation ? orientationToDb[data.orientation] : null,

    details: toPlainJson(details),
  };
}

type SectionSnapshot = {
  identite: Record<string, unknown>;
  localisation: Record<string, unknown>;
  prix: Record<string, unknown>;
  surfaces: Record<string, unknown>;
  details: unknown;
};

function snapshotFromInput(data: PropertyDossierInput, details: PropertyDetailsInput): SectionSnapshot {
  return {
    identite: {
      titleFr: data.titleFr,
      shortDescription: data.shortDescription ?? null,
      descriptionFr: data.descriptionFr ?? null,
      transaction: data.transaction,
      propertyType: data.propertyType,
      propertySubtype: data.propertySubtype ?? null,
      status: data.status,
      visibility: data.visibility,
      isFeatured: data.isFeatured,
      isGoodDeal: data.isGoodDeal,
      isCoupDeCoeur: data.isCoupDeCoeur,
    },
    localisation: {
      city: data.city,
      district: data.district ?? null,
      addressPublic: data.addressPublic ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      proximityNotes: data.proximityNotes ?? null,
    },
    prix: {
      price: data.price ?? null,
      priceOnRequest: data.priceOnRequest,
      pricePerSqm: data.pricePerSqm ?? null,
      negotiable: data.negotiable,
      agencyFeePercent: data.agencyFeePercent ?? null,
      monthlyCharges: data.monthlyCharges ?? null,
      securityDeposit: data.securityDeposit ?? null,
      estimatedYieldPercent: data.estimatedYieldPercent ?? null,
      isCreditEligible: data.isCreditEligible,
      isMourabahaEligible: data.isMourabahaEligible,
    },
    surfaces: {
      livingArea: data.livingArea ?? null,
      builtArea: data.builtArea ?? null,
      landArea: data.landArea ?? null,
      terraceArea: data.terraceArea ?? null,
      balconyArea: data.balconyArea ?? null,
      basementArea: data.basementArea ?? null,
      bedrooms: data.bedrooms ?? null,
      suites: data.suites ?? null,
      bathrooms: data.bathrooms ?? null,
      salons: data.salons ?? null,
      kitchens: data.kitchens ?? null,
      parkingSpaces: data.parkingSpaces ?? null,
      floor: data.floor ?? null,
      totalFloors: data.totalFloors ?? null,
      yearBuilt: data.yearBuilt ?? null,
      condition: data.condition ?? null,
      furnished: data.furnished ?? null,
      orientation: data.orientation ?? null,
    },
    details,
  };
}

function snapshotFromExisting(property: {
  titleFr: string;
  shortDescription: string | null;
  descriptionFr: string | null;
  transaction: keyof typeof transactionFromDb;
  propertyType: keyof typeof propertyTypeFromDb;
  propertySubtype: string | null;
  status: keyof typeof propertyStatusFromDb;
  visibility: string;
  isFeatured: boolean;
  isGoodDeal: boolean;
  isCoupDeCoeur: boolean;
  city: string;
  district: string | null;
  addressPublic: string | null;
  latitude: number | null;
  longitude: number | null;
  proximityNotes: string | null;
  price: Prisma.Decimal | null;
  priceOnRequest: boolean;
  pricePerSqm: Prisma.Decimal | null;
  negotiable: boolean;
  agencyFeePercent: Prisma.Decimal | null;
  monthlyCharges: Prisma.Decimal | null;
  securityDeposit: Prisma.Decimal | null;
  estimatedYieldPercent: Prisma.Decimal | null;
  isCreditEligible: boolean;
  isMourabahaEligible: boolean;
  livingArea: number | null;
  builtArea: number | null;
  landArea: number | null;
  terraceArea: number | null;
  balconyArea: number | null;
  basementArea: number | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  salons: number | null;
  kitchens: number | null;
  parkingSpaces: number | null;
  floor: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;
  condition: keyof typeof conditionFromDb | null;
  furnished: keyof typeof furnishedFromDb | null;
  orientation: keyof typeof orientationFromDb | null;
  details: Prisma.JsonValue | null;
}): SectionSnapshot {
  return {
    identite: {
      titleFr: property.titleFr,
      shortDescription: property.shortDescription,
      descriptionFr: property.descriptionFr,
      transaction: transactionFromDb[property.transaction],
      propertyType: propertyTypeFromDb[property.propertyType],
      propertySubtype: property.propertySubtype,
      status: propertyStatusFromDb[property.status],
      visibility: property.visibility,
      isFeatured: property.isFeatured,
      isGoodDeal: property.isGoodDeal,
      isCoupDeCoeur: property.isCoupDeCoeur,
    },
    localisation: {
      city: property.city,
      district: property.district,
      addressPublic: property.addressPublic,
      latitude: property.latitude,
      longitude: property.longitude,
      proximityNotes: property.proximityNotes,
    },
    prix: {
      price: property.price ? Number(property.price) : null,
      priceOnRequest: property.priceOnRequest,
      pricePerSqm: property.pricePerSqm ? Number(property.pricePerSqm) : null,
      negotiable: property.negotiable,
      agencyFeePercent: property.agencyFeePercent ? Number(property.agencyFeePercent) : null,
      monthlyCharges: property.monthlyCharges ? Number(property.monthlyCharges) : null,
      securityDeposit: property.securityDeposit ? Number(property.securityDeposit) : null,
      estimatedYieldPercent: property.estimatedYieldPercent ? Number(property.estimatedYieldPercent) : null,
      isCreditEligible: property.isCreditEligible,
      isMourabahaEligible: property.isMourabahaEligible,
    },
    surfaces: {
      livingArea: property.livingArea,
      builtArea: property.builtArea,
      landArea: property.landArea,
      terraceArea: property.terraceArea,
      balconyArea: property.balconyArea,
      basementArea: property.basementArea,
      bedrooms: property.bedrooms,
      suites: property.suites,
      bathrooms: property.bathrooms,
      salons: property.salons,
      kitchens: property.kitchens,
      parkingSpaces: property.parkingSpaces,
      floor: property.floor,
      totalFloors: property.totalFloors,
      yearBuilt: property.yearBuilt,
      condition: property.condition ? conditionFromDb[property.condition] : null,
      furnished: property.furnished ? furnishedFromDb[property.furnished] : null,
      orientation: property.orientation ? orientationFromDb[property.orientation] : null,
    },
    details: property.details,
  };
}

/**
 * Postgres stores `details` as jsonb, which does NOT preserve object key
 * insertion order on round-trip — a value read back can have its keys in a
 * different order than the one just written. A plain JSON.stringify() diff
 * would then flag `details` as "changed" on every single save. Sorting keys
 * recursively before comparing makes the diff depend only on content.
 */
function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val: unknown) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(val as Record<string, unknown>).sort()) {
        sorted[k] = (val as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return val;
  });
}

function diffSections(before: SectionSnapshot, after: SectionSnapshot): string[] {
  const sections: (keyof SectionSnapshot)[] = ["identite", "localisation", "prix", "surfaces", "details"];
  return sections.filter((key) => stableStringify(before[key]) !== stableStringify(after[key]));
}

async function parseDossierAndDetails(formData: FormData) {
  const parsed = parsePropertyDossierForm(formData);
  if (!parsed.success) {
    return { ok: false as const, error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  const group = propertyTypeGroup[data.propertyType];
  const detailsRaw = extractDetailsFormValues(formData, group);
  const detailsParsed = detailsSchemaForGroup(group).safeParse({ ...detailsRaw, kind: group });
  if (!detailsParsed.success) {
    return {
      ok: false as const,
      error: "Merci de corriger les caractéristiques spécifiques (section 5).",
      fieldErrors: zodFieldErrors(detailsParsed.error, "details"),
    };
  }

  const tagSlugs = formData.getAll("tags").map(String);
  const resolvedTagSlugs = await resolveExistingActiveTagSlugs(tagSlugs);

  return { ok: true as const, data, details: detailsParsed.data, tagSlugs: resolvedTagSlugs };
}

export async function createPropertyDraft(
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const user = await requireAdminUser();
  if (!canCreateProperty(user.role)) {
    return { error: "Vous n'avez pas le droit de créer un bien." };
  }

  const parsed = await parseDossierAndDetails(formData);
  if (!parsed.ok) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const reference = await generateNextPropertyReference();
  const slug = await generateUniquePropertySlug(parsed.data.titleFr);

  // A non-admin can never submit an assignment target, even via a forged
  // request: canManageTags() reuses the SUPER_ADMIN/ADMIN check.
  const assignedToId = canManageTags(user.role) ? (parsed.data.assignedToId ?? null) : null;

  let propertyId: string;
  try {
    const property = await prisma.property.create({
      data: {
        reference,
        slug,
        ...dossierToPropertyData(parsed.data, parsed.details),
        assignedToId,
        createdById: user.id,
        updatedById: user.id,
        tags: parsed.tagSlugs.length > 0 ? { connect: parsed.tagSlugs.map((tagSlug) => ({ slug: tagSlug })) } : undefined,
      },
    });
    propertyId = property.id;

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PROPERTY_CREATED",
        entity: "Property",
        entityId: property.id,
        metadata: { reference: property.reference, titleFr: property.titleFr, tagsCount: parsed.tagSlugs.length },
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Un conflit est survenu (slug ou référence). Merci de réessayer." };
    }
    throw error;
  }

  revalidatePath("/admin/biens");
  revalidatePath("/admin");
  redirect(`/admin/biens/${propertyId}`);
}

export async function updatePropertyDossier(
  id: string,
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const user = await requireAdminUser();

  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) return { error: "Bien introuvable." };
  if (!canEditProperty(user.role, user.id, existing)) {
    return { error: "Vous n'avez pas le droit de modifier ce bien." };
  }

  const parsed = await parseDossierAndDetails(formData);
  if (!parsed.ok) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const before = snapshotFromExisting(existing);
  const after = snapshotFromInput(parsed.data, parsed.details);
  const changedSections = diffSections(before, after);

  const existingTagSlugs = (
    await prisma.property.findUnique({ where: { id }, select: { tags: { select: { slug: true } } } })
  )?.tags.map((tag) => tag.slug) ?? [];
  const addedTags = parsed.tagSlugs.filter((tagSlug) => !existingTagSlugs.includes(tagSlug));
  const removedTags = existingTagSlugs.filter((tagSlug) => !parsed.tagSlugs.includes(tagSlug));

  const slug = await generateUniquePropertySlug(parsed.data.titleFr, id);

  // Only SUPER_ADMIN/ADMIN can (re)assign a property — a submitted value
  // from any other role is ignored server-side, never trusted from the form.
  const assignedToId = canManageTags(user.role) ? (parsed.data.assignedToId ?? null) : undefined;

  try {
    await prisma.property.update({
      where: { id },
      data: {
        slug,
        ...dossierToPropertyData(parsed.data, parsed.details),
        ...(assignedToId !== undefined ? { assignedToId } : {}),
        updatedById: user.id,
        tags: { set: parsed.tagSlugs.map((tagSlug) => ({ slug: tagSlug })) },
      },
    });

    if (changedSections.length > 0) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PROPERTY_UPDATED",
          entity: "Property",
          entityId: id,
          metadata: { reference: existing.reference, sections: changedSections },
        },
      });
    }

    if (addedTags.length > 0 || removedTags.length > 0) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PROPERTY_TAGS_UPDATED",
          entity: "Property",
          entityId: id,
          metadata: { reference: existing.reference, added: addedTags, removed: removedTags },
        },
      });
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Un conflit est survenu (slug). Merci de réessayer." };
    }
    throw error;
  }

  revalidatePath(`/admin/biens/${id}`);
  revalidatePath("/admin/biens");
  redirect(`/admin/biens/${id}`);
}

function normalizeForCompare(value: string | number | boolean | Date | Prisma.Decimal | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (value instanceof Prisma.Decimal) return value.toString();
  return String(value);
}

function diffPrivateFields(existing: PropertyPrivateRow | null, next: PropertyPrivateInput): string[] {
  const fields: (keyof PropertyPrivateInput)[] = [
    "privateAddress",
    "ownerName",
    "ownerPhone",
    "ownerEmail",
    "mandateReference",
    "mandateStartDate",
    "mandateEndDate",
    "minimumNetPrice",
    "internalNotes",
    "source",
  ];
  return fields.filter(
    (field) => normalizeForCompare(existing?.[field] ?? null) !== normalizeForCompare(next[field] ?? null)
  );
}

export async function savePropertyPrivateData(
  id: string,
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const user = await requireAdminUser();
  if (!canViewPrivateData(user.role)) {
    return { error: "Vous n'avez pas le droit de modifier les données privées." };
  }

  const property = await prisma.property.findUnique({ where: { id }, select: { id: true, reference: true } });
  if (!property) return { error: "Bien introuvable." };

  const parsed = parsePropertyPrivateForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  const existing = await prisma.propertyPrivate.findUnique({ where: { propertyId: id } });
  const changedFields = diffPrivateFields(existing, data);

  await prisma.propertyPrivate.upsert({
    where: { propertyId: id },
    create: {
      propertyId: id,
      privateAddress: data.privateAddress,
      ownerName: data.ownerName,
      ownerPhone: data.ownerPhone,
      ownerEmail: data.ownerEmail,
      mandateReference: data.mandateReference,
      mandateStartDate: data.mandateStartDate ? new Date(data.mandateStartDate) : undefined,
      mandateEndDate: data.mandateEndDate ? new Date(data.mandateEndDate) : undefined,
      minimumNetPrice: data.minimumNetPrice,
      internalNotes: data.internalNotes,
      source: data.source,
    },
    update: {
      privateAddress: data.privateAddress ?? null,
      ownerName: data.ownerName ?? null,
      ownerPhone: data.ownerPhone ?? null,
      ownerEmail: data.ownerEmail ?? null,
      mandateReference: data.mandateReference ?? null,
      mandateStartDate: data.mandateStartDate ? new Date(data.mandateStartDate) : null,
      mandateEndDate: data.mandateEndDate ? new Date(data.mandateEndDate) : null,
      minimumNetPrice: data.minimumNetPrice ?? null,
      internalNotes: data.internalNotes ?? null,
      source: data.source ?? null,
    },
  });

  if (changedFields.length > 0) {
    await prisma.property.update({ where: { id }, data: { updatedById: user.id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PROPERTY_PRIVATE_UPDATED",
        entity: "Property",
        entityId: id,
        // Field NAMES only — never values (owner contact, floor price, notes stay out of the audit trail).
        metadata: { reference: property.reference, fieldsChanged: changedFields },
      },
    });
  }

  revalidatePath(`/admin/biens/${id}`);
  redirect(`/admin/biens/${id}`);
}

export async function createPropertyTag(_prevState: TagFormState, formData: FormData): Promise<TagFormState> {
  const user = await requireAdminUser();
  if (!canManageTags(user.role)) {
    return { error: "Vous n'avez pas le droit de créer un tag." };
  }

  const labelFr = String(formData.get("labelFr") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "");
  const knownCategories = new Set(tagTaxonomy.map((tag) => tag.category));

  if (!labelFr) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: { labelFr: "Libellé requis." } };
  }
  if (!knownCategories.has(categoryRaw as TagCategory)) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: { category: "Catégorie requise." } };
  }
  const category = categoryRaw as TagCategory;

  const slug = slugify(labelFr);
  if (!slug) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: { labelFr: "Libellé invalide." } };
  }

  const existingTag = await prisma.propertyTag.findUnique({ where: { slug } });
  if (existingTag) {
    return { error: "Ce tag existe déjà.", fieldErrors: { labelFr: "Un tag avec un slug identique existe déjà." } };
  }

  await prisma.propertyTag.create({ data: { slug, labelFr, category: tagCategoryToDb[category] } });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PROPERTY_TAG_CREATED",
      entity: "PropertyTag",
      entityId: slug,
      metadata: { labelFr, category },
    },
  });

  return { tag: { slug, labelFr, category } };
}

export async function publishProperty(id: string): Promise<void> {
  const user = await requireAdminUser();

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) redirect("/admin/biens");
  if (!canPublishProperty(user.role)) {
    redirect(`/admin/biens/${id}?erreur=permission`);
  }
  if (!property.priceOnRequest && property.price === null) {
    redirect(`/admin/biens/${id}?erreur=publication`);
  }

  await prisma.property.update({
    where: { id },
    data: { publicationStatus: "PUBLIE", publishedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PROPERTY_PUBLISHED",
      entity: "Property",
      entityId: id,
      metadata: { reference: property.reference },
    },
  });

  revalidatePath(`/admin/biens/${id}`);
  revalidatePath("/admin/biens");
  revalidatePath("/admin");
  redirect(`/admin/biens/${id}`);
}

export async function unpublishProperty(id: string): Promise<void> {
  const user = await requireAdminUser();

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) redirect("/admin/biens");
  if (!canPublishProperty(user.role)) {
    redirect(`/admin/biens/${id}?erreur=permission`);
  }

  await prisma.property.update({
    where: { id },
    data: { publicationStatus: "BROUILLON", publishedAt: null },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PROPERTY_UNPUBLISHED",
      entity: "Property",
      entityId: id,
      metadata: { reference: property.reference },
    },
  });

  revalidatePath(`/admin/biens/${id}`);
  revalidatePath("/admin/biens");
  revalidatePath("/admin");
  redirect(`/admin/biens/${id}`);
}

export async function archiveProperty(id: string): Promise<void> {
  const user = await requireAdminUser();

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) redirect("/admin/biens");
  if (!canArchiveProperty(user.role)) {
    redirect(`/admin/biens/${id}?erreur=permission`);
  }

  await prisma.property.update({
    where: { id },
    data: { publicationStatus: "ARCHIVE", archivedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PROPERTY_ARCHIVED",
      entity: "Property",
      entityId: id,
      metadata: { reference: property.reference },
    },
  });

  revalidatePath(`/admin/biens/${id}`);
  revalidatePath("/admin/biens");
  revalidatePath("/admin");
  redirect(`/admin/biens/${id}`);
}
