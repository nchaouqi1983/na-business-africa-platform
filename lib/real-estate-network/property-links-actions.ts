"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import {
  parsePropertyOwnerLinkForm,
  parsePropertyIntermediaryLinkForm,
  parsePropertyDevelopmentLinkForm,
} from "@/lib/real-estate-network/property-links-schema";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";

export type RelationFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
    }
  | undefined;

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function assertCanManage(propertyId: string) {
  const user = await requireAdminUser();
  if (!canManageRealEstateNetwork(user.role)) {
    return { ok: false as const, state: { error: "Vous n'avez pas le droit de gérer les relations de ce bien." } };
  }
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } });
  if (!property) return { ok: false as const, state: { error: "Bien introuvable." } };
  return { ok: true as const, user };
}

// --- Owners ---------------------------------------------------------------

export async function addPropertyOwnerLink(propertyId: string, _prevState: RelationFormState, formData: FormData): Promise<RelationFormState> {
  const gate = await assertCanManage(propertyId);
  if (!gate.ok) return gate.state;

  const parsed = parsePropertyOwnerLinkForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  const owner = await prisma.owner.findUnique({ where: { id: parsed.data.ownerId } });
  if (!owner) return { error: "Propriétaire introuvable.", fieldErrors: { ownerId: "Propriétaire introuvable." } };

  try {
    await prisma.propertyOwner.create({
      data: {
        propertyId,
        ownerId: parsed.data.ownerId,
        role: parsed.data.role,
        quoteShare: parsed.data.quoteShare,
        isMainContact: parsed.data.isMainContact,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Ce propriétaire est déjà rattaché à ce bien.", fieldErrors: { ownerId: "Déjà rattaché." } };
    }
    throw error;
  }

  await prisma.auditLog.create({
    data: { userId: gate.user.id, action: "PROPERTY_OWNER_LINKED", entity: "Property", entityId: propertyId, metadata: { ownerId: parsed.data.ownerId, role: parsed.data.role } },
  });

  revalidatePath(`/admin/biens/${propertyId}`);
}

export async function updatePropertyOwnerLink(linkId: string, _prevState: RelationFormState, formData: FormData): Promise<RelationFormState> {
  const link = await prisma.propertyOwner.findUnique({ where: { id: linkId } });
  if (!link) return { error: "Rattachement introuvable." };

  const gate = await assertCanManage(link.propertyId);
  if (!gate.ok) return gate.state;

  const parsed = parsePropertyOwnerLinkForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  await prisma.propertyOwner.update({
    where: { id: linkId },
    data: { role: parsed.data.role, quoteShare: parsed.data.quoteShare ?? null, isMainContact: parsed.data.isMainContact },
  });

  await prisma.auditLog.create({
    data: { userId: gate.user.id, action: "PROPERTY_OWNER_LINK_UPDATED", entity: "Property", entityId: link.propertyId, metadata: { ownerId: link.ownerId, role: parsed.data.role } },
  });

  revalidatePath(`/admin/biens/${link.propertyId}`);
}

export async function removePropertyOwnerLink(linkId: string): Promise<void> {
  const link = await prisma.propertyOwner.findUnique({ where: { id: linkId } });
  if (!link) return;

  const gate = await assertCanManage(link.propertyId);
  if (!gate.ok) return;

  await prisma.propertyOwner.delete({ where: { id: linkId } });

  await prisma.auditLog.create({
    data: { userId: gate.user.id, action: "PROPERTY_OWNER_UNLINKED", entity: "Property", entityId: link.propertyId, metadata: { ownerId: link.ownerId } },
  });

  revalidatePath(`/admin/biens/${link.propertyId}`);
}

// --- Intermediaries ---------------------------------------------------------

export async function addPropertyIntermediaryLink(propertyId: string, _prevState: RelationFormState, formData: FormData): Promise<RelationFormState> {
  const gate = await assertCanManage(propertyId);
  if (!gate.ok) return gate.state;

  const parsed = parsePropertyIntermediaryLinkForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  const intermediary = await prisma.intermediary.findUnique({ where: { id: parsed.data.intermediaryId } });
  if (!intermediary) return { error: "Intermédiaire introuvable.", fieldErrors: { intermediaryId: "Intermédiaire introuvable." } };

  try {
    await prisma.propertyIntermediary.create({
      data: {
        propertyId,
        intermediaryId: parsed.data.intermediaryId,
        role: parsed.data.role,
        note: parsed.data.note,
        commissionType: parsed.data.commissionType,
        commissionRate: parsed.data.commissionRate,
        commissionAmount: parsed.data.commissionAmount,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Cet intermédiaire est déjà rattaché à ce bien.", fieldErrors: { intermediaryId: "Déjà rattaché." } };
    }
    throw error;
  }

  // Never log the free-text note or the commission amount/rate.
  await prisma.auditLog.create({
    data: {
      userId: gate.user.id,
      action: "PROPERTY_INTERMEDIARY_LINKED",
      entity: "Property",
      entityId: propertyId,
      metadata: { intermediaryId: parsed.data.intermediaryId, role: parsed.data.role ?? null },
    },
  });

  revalidatePath(`/admin/biens/${propertyId}`);
}

export async function updatePropertyIntermediaryLink(
  linkId: string,
  _prevState: RelationFormState,
  formData: FormData
): Promise<RelationFormState> {
  const link = await prisma.propertyIntermediary.findUnique({ where: { id: linkId } });
  if (!link) return { error: "Rattachement introuvable." };

  const gate = await assertCanManage(link.propertyId);
  if (!gate.ok) return gate.state;

  const parsed = parsePropertyIntermediaryLinkForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  await prisma.propertyIntermediary.update({
    where: { id: linkId },
    data: {
      role: parsed.data.role ?? null,
      note: parsed.data.note ?? null,
      commissionType: parsed.data.commissionType ?? null,
      commissionRate: parsed.data.commissionRate ?? null,
      commissionAmount: parsed.data.commissionAmount ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: gate.user.id,
      action: "PROPERTY_INTERMEDIARY_LINK_UPDATED",
      entity: "Property",
      entityId: link.propertyId,
      metadata: { intermediaryId: link.intermediaryId, role: parsed.data.role ?? null },
    },
  });

  revalidatePath(`/admin/biens/${link.propertyId}`);
}

export async function removePropertyIntermediaryLink(linkId: string): Promise<void> {
  const link = await prisma.propertyIntermediary.findUnique({ where: { id: linkId } });
  if (!link) return;

  const gate = await assertCanManage(link.propertyId);
  if (!gate.ok) return;

  await prisma.propertyIntermediary.delete({ where: { id: linkId } });

  await prisma.auditLog.create({
    data: { userId: gate.user.id, action: "PROPERTY_INTERMEDIARY_UNLINKED", entity: "Property", entityId: link.propertyId, metadata: { intermediaryId: link.intermediaryId } },
  });

  revalidatePath(`/admin/biens/${link.propertyId}`);
}

// --- Development program / lot ---------------------------------------------

export async function updatePropertyDevelopmentLink(
  propertyId: string,
  _prevState: RelationFormState,
  formData: FormData
): Promise<RelationFormState> {
  const gate = await assertCanManage(propertyId);
  if (!gate.ok) return gate.state;

  const parsed = parsePropertyDevelopmentLinkForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { developmentProgramId, developmentLotId } = parsed.data;

  if (developmentProgramId) {
    const program = await prisma.developmentProgram.findUnique({ where: { id: developmentProgramId } });
    if (!program) return { error: "Programme introuvable.", fieldErrors: { developmentProgramId: "Programme introuvable." } };
  }

  if (developmentLotId) {
    if (!developmentProgramId) {
      return { error: "Choisissez un programme avant de choisir un lot.", fieldErrors: { developmentLotId: "Programme requis." } };
    }
    const lot = await prisma.developmentLot.findUnique({ where: { id: developmentLotId } });
    if (!lot || lot.programId !== developmentProgramId) {
      return { error: "Ce lot n'appartient pas au programme sélectionné.", fieldErrors: { developmentLotId: "Lot invalide pour ce programme." } };
    }
  }

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      developmentProgramId: developmentProgramId ?? null,
      // Clearing the program always clears the lot too — a lot cannot outlive its program link on a property.
      developmentLotId: developmentProgramId ? (developmentLotId ?? null) : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: gate.user.id,
      action: "PROPERTY_DEVELOPMENT_LINK_UPDATED",
      entity: "Property",
      entityId: propertyId,
      metadata: { developmentProgramId: developmentProgramId ?? null, developmentLotId: developmentProgramId ? (developmentLotId ?? null) : null },
    },
  });

  revalidatePath(`/admin/biens/${propertyId}`);
}
