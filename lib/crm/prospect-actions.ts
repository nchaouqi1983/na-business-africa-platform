"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { PropertyType as DbPropertyType, PropertyTransaction as DbTransaction } from "@/lib/generated/prisma/client";
import { requireAdminUser } from "@/lib/auth/dal";
import { canCreateProspect, canEditProspect } from "@/lib/crm/permissions";
import { parseProspectForm, parseProspectStatusForm, parsePropertyInterestForm, type ProspectFormInput } from "@/lib/crm/prospect-schema";
import { generateNextProspectReference } from "@/lib/crm/reference";
import { notifyProspectAssigned } from "@/lib/crm/notification-service";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";

export type ProspectFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
      prospect?: { id: string; reference: string };
    }
  | undefined;

export type PropertyInterestFormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

/**
 * Field NAMES that changed, never their values — the diff feeds AuditLog,
 * which must never carry phone/email/notes/company/budget contents (personal
 * or commercially sensitive data). Same rule as lib/real-estate-network/owner-actions.ts.
 */
function diffProspectFields(
  existing: { [K in keyof ProspectFormInput]?: ProspectFormInput[K] | null } | null,
  next: ProspectFormInput
): string[] {
  const fields = Object.keys(next) as (keyof ProspectFormInput)[];
  return fields.filter((field) => JSON.stringify(existing?.[field] ?? null) !== JSON.stringify(next[field] ?? null));
}

async function assertAssignableUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  return user !== null;
}

export async function createProspect(_prevState: ProspectFormState, formData: FormData): Promise<ProspectFormState> {
  const user = await requireAdminUser();
  if (!canCreateProspect(user.role)) {
    return { error: "Vous n'avez pas le droit de créer un prospect." };
  }

  const parsed = parseProspectForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  if (parsed.data.assignedToId && !(await assertAssignableUser(parsed.data.assignedToId))) {
    return { error: "Utilisateur assigné introuvable.", fieldErrors: { assignedToId: "Utilisateur introuvable." } };
  }

  const reference = await generateNextProspectReference();

  const prospect = await prisma.prospect.create({
    data: {
      reference,
      type: parsed.data.type,
      kind: parsed.data.kind,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      companyName: parsed.data.companyName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      preferredLanguage: parsed.data.preferredLanguage,
      source: parsed.data.source,
      status: parsed.data.status,
      searchCities: parsed.data.searchCities,
      searchDistricts: parsed.data.searchDistricts,
      searchPropertyTypes: parsed.data.searchPropertyTypes as DbPropertyType[],
      searchTransaction: parsed.data.searchTransaction as DbTransaction | undefined,
      budgetMin: parsed.data.budgetMin,
      budgetMax: parsed.data.budgetMax,
      currency: parsed.data.currency,
      projectTimeline: parsed.data.projectTimeline,
      internalNotes: parsed.data.internalNotes,
      assignedToId: parsed.data.assignedToId,
      createdById: user.id,
    },
  });

  // Never log name/phone/email/company/notes/budget — only structural fields.
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PROSPECT_CREATED",
      entity: "Prospect",
      entityId: prospect.id,
      metadata: { type: prospect.type, source: prospect.source, status: prospect.status },
    },
  });

  if (prospect.assignedToId) {
    await notifyProspectAssigned(prospect, prospect.assignedToId);
  }

  revalidatePath("/admin/prospects");
  revalidatePath("/admin/demandes");
  redirect(`/admin/prospects/${prospect.id}`);
}

export async function updateProspect(id: string, _prevState: ProspectFormState, formData: FormData): Promise<ProspectFormState> {
  const user = await requireAdminUser();

  const existing = await prisma.prospect.findUnique({ where: { id } });
  if (!existing) return { error: "Prospect introuvable." };
  if (!canEditProspect(user.role, user.id, existing)) {
    return { error: "Vous n'avez pas le droit de modifier ce prospect." };
  }

  const parsed = parseProspectForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  if (parsed.data.assignedToId && !(await assertAssignableUser(parsed.data.assignedToId))) {
    return { error: "Utilisateur assigné introuvable.", fieldErrors: { assignedToId: "Utilisateur introuvable." } };
  }

  const changedFields = diffProspectFields(
    {
      type: existing.type,
      kind: existing.kind,
      firstName: existing.firstName ?? undefined,
      lastName: existing.lastName ?? undefined,
      companyName: existing.companyName ?? undefined,
      phone: existing.phone,
      email: existing.email ?? undefined,
      preferredLanguage: existing.preferredLanguage,
      source: existing.source,
      status: existing.status,
      searchCities: existing.searchCities,
      searchDistricts: existing.searchDistricts,
      searchPropertyTypes: existing.searchPropertyTypes,
      searchTransaction: existing.searchTransaction ?? undefined,
      budgetMin: existing.budgetMin ? Number(existing.budgetMin) : undefined,
      budgetMax: existing.budgetMax ? Number(existing.budgetMax) : undefined,
      currency: existing.currency,
      projectTimeline: existing.projectTimeline ?? undefined,
      internalNotes: existing.internalNotes ?? undefined,
      assignedToId: existing.assignedToId ?? undefined,
    } as Partial<ProspectFormInput>,
    parsed.data
  );

  await prisma.prospect.update({
    where: { id },
    data: {
      type: parsed.data.type,
      kind: parsed.data.kind,
      firstName: parsed.data.firstName ?? null,
      lastName: parsed.data.lastName ?? null,
      companyName: parsed.data.companyName ?? null,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      preferredLanguage: parsed.data.preferredLanguage,
      source: parsed.data.source,
      status: parsed.data.status,
      searchCities: parsed.data.searchCities,
      searchDistricts: parsed.data.searchDistricts,
      searchPropertyTypes: parsed.data.searchPropertyTypes as DbPropertyType[],
      searchTransaction: (parsed.data.searchTransaction as DbTransaction | undefined) ?? null,
      budgetMin: parsed.data.budgetMin ?? null,
      budgetMax: parsed.data.budgetMax ?? null,
      currency: parsed.data.currency,
      projectTimeline: parsed.data.projectTimeline ?? null,
      internalNotes: parsed.data.internalNotes ?? null,
      assignedToId: parsed.data.assignedToId ?? null,
    },
  });

  // Field NAMES only — never phone/email/notes/company/budget values.
  if (changedFields.length > 0) {
    await prisma.auditLog.create({
      data: { userId: user.id, action: "PROSPECT_UPDATED", entity: "Prospect", entityId: id, metadata: { fieldsChanged: changedFields } },
    });
  }

  if (parsed.data.assignedToId && parsed.data.assignedToId !== existing.assignedToId) {
    await notifyProspectAssigned({ id, reference: existing.reference }, parsed.data.assignedToId);
  }

  revalidatePath(`/admin/prospects/${id}`);
  revalidatePath("/admin/prospects");
  revalidatePath("/admin/demandes");
  redirect(`/admin/prospects/${id}`);
}

/**
 * Quick status change — a plain (non-useActionState) form action used from
 * the prospect 360° status dropdown and the /admin/demandes quick buttons.
 * Never redirects away from the page it was called from, just revalidates.
 */
export async function setProspectStatus(id: string, formData: FormData): Promise<void> {
  const user = await requireAdminUser();

  const existing = await prisma.prospect.findUnique({ where: { id } });
  if (!existing) redirect("/admin/prospects");
  if (!canEditProspect(user.role, user.id, existing)) {
    redirect(`/admin/prospects/${id}?erreur=permission`);
  }

  const parsed = parseProspectStatusForm(formData);
  if (!parsed.success) redirect(`/admin/prospects/${id}`);

  if (parsed.data.status !== existing.status) {
    await prisma.prospect.update({ where: { id }, data: { status: parsed.data.status } });
    await prisma.auditLog.create({
      data: { userId: user.id, action: "PROSPECT_STATUS_CHANGED", entity: "Prospect", entityId: id, metadata: { status: parsed.data.status } },
    });
  }

  revalidatePath(`/admin/prospects/${id}`);
  revalidatePath("/admin/prospects");
  revalidatePath("/admin/demandes");
}

/** Add or update a bien d'intérêt from the prospect's 360° screen — upsert on the (prospectId, propertyId) pair. */
export async function upsertPropertyInterest(
  prospectId: string,
  _prevState: PropertyInterestFormState,
  formData: FormData
): Promise<PropertyInterestFormState> {
  const user = await requireAdminUser();

  const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
  if (!prospect) return { error: "Prospect introuvable." };
  if (!canEditProspect(user.role, user.id, prospect)) {
    return { error: "Vous n'avez pas le droit de modifier ce prospect." };
  }

  const parsed = parsePropertyInterestForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId }, select: { id: true } });
  if (!property) return { error: "Bien introuvable.", fieldErrors: { propertyId: "Bien introuvable." } };

  await prisma.prospectPropertyInterest.upsert({
    where: { prospectId_propertyId: { prospectId, propertyId: parsed.data.propertyId } },
    create: {
      prospectId,
      propertyId: parsed.data.propertyId,
      interestLevel: parsed.data.interestLevel,
      internalNote: parsed.data.internalNote,
    },
    update: {
      interestLevel: parsed.data.interestLevel,
      internalNote: parsed.data.internalNote ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PROSPECT_INTEREST_SET",
      entity: "Prospect",
      entityId: prospectId,
      metadata: { propertyId: parsed.data.propertyId, interestLevel: parsed.data.interestLevel },
    },
  });

  revalidatePath(`/admin/prospects/${prospectId}`);
  revalidatePath(`/admin/biens/${parsed.data.propertyId}`);
  return undefined;
}

/** Removes a bien d'intérêt link — the link itself carries no history worth keeping once retracted. */
export async function removePropertyInterest(prospectId: string, propertyId: string): Promise<void> {
  const user = await requireAdminUser();

  const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
  if (!prospect || !canEditProspect(user.role, user.id, prospect)) {
    redirect(`/admin/prospects/${prospectId}?erreur=permission`);
  }

  await prisma.prospectPropertyInterest.deleteMany({ where: { prospectId, propertyId } });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "PROSPECT_INTEREST_REMOVED", entity: "Prospect", entityId: prospectId, metadata: { propertyId } },
  });

  revalidatePath(`/admin/prospects/${prospectId}`);
  revalidatePath(`/admin/biens/${propertyId}`);
  redirect(`/admin/prospects/${prospectId}`);
}
