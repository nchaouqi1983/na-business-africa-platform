"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageFinance } from "@/lib/finance/permissions";
import { parseMandateForm, parseMandateQuickForm, type MandateFormInput } from "@/lib/finance/mandate-schema";
import { mandateStatusValues, type MandateStatusValue } from "@/lib/finance/enum-labels";
import { generateNextMandateReference } from "@/lib/finance/reference";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";

export type MandateFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
      mandate?: { id: string; reference: string };
    }
  | undefined;

function diffMandateFields(
  existing: { [K in keyof MandateFormInput]?: MandateFormInput[K] | null } | null,
  next: MandateFormInput
): string[] {
  const fields = Object.keys(next) as (keyof MandateFormInput)[];
  return fields.filter((field) => String(existing?.[field] ?? "") !== String(next[field] ?? ""));
}

async function assertPropertyAccessible(propertyId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } });
  return property !== null;
}

/**
 * Standalone "Nouveau mandat" page (/admin/mandats/nouveau) — propertyId
 * comes from the form's own property picker. Always redirects to the
 * detail screen on success.
 */
export async function createMandate(_prevState: MandateFormState, formData: FormData): Promise<MandateFormState> {
  const user = await requireAdminUser();
  if (!canManageFinance(user.role)) {
    return { error: "Vous n'avez pas le droit de créer un mandat." };
  }

  const propertyId = String(formData.get("propertyId") ?? "").trim();
  if (!propertyId) {
    return { error: "Merci de choisir un bien.", fieldErrors: { propertyId: "Bien requis." } };
  }
  if (!(await assertPropertyAccessible(propertyId))) {
    return { error: "Bien introuvable.", fieldErrors: { propertyId: "Bien introuvable." } };
  }

  const parsed = parseMandateForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  if (parsed.data.ownerId) {
    const owner = await prisma.owner.findUnique({ where: { id: parsed.data.ownerId } });
    if (!owner) return { error: "Propriétaire introuvable.", fieldErrors: { ownerId: "Propriétaire introuvable." } };
  }
  if (parsed.data.documentId) {
    const document = await prisma.propertyDocument.findUnique({ where: { id: parsed.data.documentId } });
    if (!document || document.propertyId !== propertyId || document.type !== "MANDAT") {
      return { error: "Document de mandat invalide.", fieldErrors: { documentId: "Document invalide pour ce bien." } };
    }
  }

  const reference = await generateNextMandateReference();

  const mandate = await prisma.mandate.create({
    data: {
      reference,
      propertyId,
      ownerId: parsed.data.ownerId,
      type: parsed.data.type,
      status: parsed.data.status,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      isExclusive: parsed.data.isExclusive,
      displayedPrice: parsed.data.displayedPrice,
      agreedNetSellerPrice: parsed.data.agreedNetSellerPrice,
      internalConditions: parsed.data.internalConditions,
      documentId: parsed.data.documentId,
      createdById: user.id,
    },
  });

  // Never log price/conditions/document — only structural fields.
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "MANDATE_CREATED",
      entity: "Mandate",
      entityId: mandate.id,
      metadata: { propertyId, type: mandate.type, status: mandate.status },
    },
  });

  revalidatePath("/admin/mandats");
  revalidatePath(`/admin/biens/${propertyId}`);
  redirect(`/admin/mandats/${mandate.id}`);
}

/** Inline quick-create from a bien dossier's "Mandat & commissions" section — never redirects. */
export async function createMandateQuick(propertyId: string, _prevState: MandateFormState, formData: FormData): Promise<MandateFormState> {
  const user = await requireAdminUser();
  if (!canManageFinance(user.role)) {
    return { error: "Vous n'avez pas le droit de créer un mandat." };
  }
  if (!(await assertPropertyAccessible(propertyId))) {
    return { error: "Bien introuvable." };
  }

  const parsed = parseMandateQuickForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  if (parsed.data.ownerId) {
    const owner = await prisma.owner.findUnique({ where: { id: parsed.data.ownerId } });
    if (!owner) return { error: "Propriétaire introuvable.", fieldErrors: { ownerId: "Propriétaire introuvable." } };
  }

  const reference = await generateNextMandateReference();

  const mandate = await prisma.mandate.create({
    data: {
      reference,
      propertyId,
      ownerId: parsed.data.ownerId,
      type: parsed.data.type,
      status: "BROUILLON",
      createdById: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "MANDATE_CREATED",
      entity: "Mandate",
      entityId: mandate.id,
      metadata: { propertyId, type: mandate.type, status: mandate.status },
    },
  });

  revalidatePath("/admin/mandats");
  revalidatePath(`/admin/biens/${propertyId}`);
  return { mandate: { id: mandate.id, reference: mandate.reference } };
}

export async function updateMandate(id: string, _prevState: MandateFormState, formData: FormData): Promise<MandateFormState> {
  const user = await requireAdminUser();
  if (!canManageFinance(user.role)) {
    return { error: "Vous n'avez pas le droit de modifier ce mandat." };
  }

  const existing = await prisma.mandate.findUnique({ where: { id } });
  if (!existing) return { error: "Mandat introuvable." };

  const parsed = parseMandateForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  if (parsed.data.ownerId) {
    const owner = await prisma.owner.findUnique({ where: { id: parsed.data.ownerId } });
    if (!owner) return { error: "Propriétaire introuvable.", fieldErrors: { ownerId: "Propriétaire introuvable." } };
  }
  if (parsed.data.documentId) {
    const document = await prisma.propertyDocument.findUnique({ where: { id: parsed.data.documentId } });
    if (!document || document.propertyId !== existing.propertyId || document.type !== "MANDAT") {
      return { error: "Document de mandat invalide.", fieldErrors: { documentId: "Document invalide pour ce bien." } };
    }
  }

  const changedFields = diffMandateFields(
    {
      ownerId: existing.ownerId ?? undefined,
      type: existing.type,
      status: existing.status,
      startDate: existing.startDate ? existing.startDate.toISOString().slice(0, 10) : undefined,
      endDate: existing.endDate ? existing.endDate.toISOString().slice(0, 10) : undefined,
      isExclusive: existing.isExclusive,
      documentId: existing.documentId ?? undefined,
    } as Partial<MandateFormInput>,
    parsed.data
  );

  await prisma.mandate.update({
    where: { id },
    data: {
      ownerId: parsed.data.ownerId ?? null,
      type: parsed.data.type,
      status: parsed.data.status,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      isExclusive: parsed.data.isExclusive,
      displayedPrice: parsed.data.displayedPrice ?? null,
      agreedNetSellerPrice: parsed.data.agreedNetSellerPrice ?? null,
      internalConditions: parsed.data.internalConditions ?? null,
      documentId: parsed.data.documentId ?? null,
    },
  });

  // Structural field names only — never price/conditions values.
  if (changedFields.length > 0) {
    await prisma.auditLog.create({
      data: { userId: user.id, action: "MANDATE_UPDATED", entity: "Mandate", entityId: id, metadata: { fieldsChanged: changedFields } },
    });
  }

  revalidatePath(`/admin/mandats/${id}`);
  revalidatePath("/admin/mandats");
  revalidatePath(`/admin/biens/${existing.propertyId}`);
  redirect(`/admin/mandats/${id}`);
}

/**
 * Direct status transitions (Activer / Résilier / Finaliser…) exposed as
 * small bound-form buttons on the detail page. A mandate is never deleted —
 * RESILIE is the terminal "retired" state, mirroring the "no physical
 * delete once it matters" rule for the whole module.
 */
export async function setMandateStatus(id: string, status: MandateStatusValue): Promise<void> {
  const user = await requireAdminUser();
  if (!canManageFinance(user.role)) {
    redirect(`/admin/mandats/${id}?erreur=permission`);
  }
  if (!mandateStatusValues.includes(status)) {
    redirect(`/admin/mandats/${id}`);
  }

  const mandate = await prisma.mandate.findUnique({ where: { id } });
  if (!mandate) redirect("/admin/mandats");

  await prisma.mandate.update({ where: { id }, data: { status } });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "MANDATE_STATUS_CHANGED", entity: "Mandate", entityId: id, metadata: { status } },
  });

  revalidatePath(`/admin/mandats/${id}`);
  revalidatePath("/admin/mandats");
  revalidatePath(`/admin/biens/${mandate.propertyId}`);
  redirect(`/admin/mandats/${id}`);
}
