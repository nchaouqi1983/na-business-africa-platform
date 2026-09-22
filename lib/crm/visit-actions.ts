"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth/dal";
import { canCreateVisit, canEditVisit, canViewProspect } from "@/lib/crm/permissions";
import { parseVisitForm, type VisitFormInput } from "@/lib/crm/visit-schema";
import { generateNextVisitReference } from "@/lib/crm/reference";
import { notifyVisitCreated, notifyVisitUpdated, notifyVisitCancelled } from "@/lib/crm/notification-service";
import { visitStatusValues, type VisitStatusValue } from "@/lib/crm/enum-labels";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";

export type VisitFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
      visit?: { id: string; reference: string };
    }
  | undefined;

/** Field NAMES that changed, never their values — preVisitNote/prospectFeedback/internalNote must never reach AuditLog. */
function diffVisitFields(
  existing: { [K in keyof VisitFormInput]?: VisitFormInput[K] | null } | null,
  next: VisitFormInput
): string[] {
  const fields = Object.keys(next) as (keyof VisitFormInput)[];
  return fields.filter((field) => String(existing?.[field] ?? "") !== String(next[field] ?? ""));
}

export async function createVisit(_prevState: VisitFormState, formData: FormData): Promise<VisitFormState> {
  const user = await requireAdminUser();
  if (!canCreateVisit(user.role)) {
    return { error: "Vous n'avez pas le droit de planifier une visite." };
  }

  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const prospectId = String(formData.get("prospectId") ?? "").trim();
  if (!propertyId) return { error: "Merci de choisir un bien.", fieldErrors: { propertyId: "Bien requis." } };
  if (!prospectId) return { error: "Merci de choisir un prospect.", fieldErrors: { prospectId: "Prospect requis." } };

  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } });
  if (!property) return { error: "Bien introuvable.", fieldErrors: { propertyId: "Bien introuvable." } };

  const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
  if (!prospect) return { error: "Prospect introuvable.", fieldErrors: { prospectId: "Prospect introuvable." } };
  if (!canViewProspect(user.role, user.id, prospect)) {
    return { error: "Vous n'avez pas accès à ce prospect.", fieldErrors: { prospectId: "Prospect inaccessible." } };
  }

  const parsed = parseVisitForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  if (parsed.data.assignedToId) {
    const assignee = await prisma.user.findUnique({ where: { id: parsed.data.assignedToId }, select: { id: true } });
    if (!assignee) return { error: "Utilisateur assigné introuvable.", fieldErrors: { assignedToId: "Utilisateur introuvable." } };
  }

  const reference = await generateNextVisitReference();

  const visit = await prisma.visit.create({
    data: {
      reference,
      propertyId,
      prospectId,
      assignedToId: parsed.data.assignedToId ?? user.id,
      scheduledStart: new Date(parsed.data.scheduledStart),
      scheduledEnd: parsed.data.scheduledEnd ? new Date(parsed.data.scheduledEnd) : undefined,
      status: parsed.data.status,
      type: parsed.data.type,
      participantsCount: parsed.data.participantsCount,
      preVisitNote: parsed.data.preVisitNote,
      createdById: user.id,
    },
  });

  // Update the prospect's commercial funnel status when its first visit gets planned.
  if (prospect.status === "NOUVEAU" || prospect.status === "A_QUALIFIER" || prospect.status === "QUALIFIE") {
    await prisma.prospect.update({ where: { id: prospectId }, data: { status: "VISITE_PLANIFIEE" } });
  }

  // Never log notes — only structural fields.
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "VISIT_CREATED",
      entity: "Visit",
      entityId: visit.id,
      metadata: { propertyId, prospectId, status: visit.status, type: visit.type },
    },
  });

  await notifyVisitCreated(visit);

  revalidatePath("/admin/visites");
  revalidatePath(`/admin/prospects/${prospectId}`);
  revalidatePath(`/admin/biens/${propertyId}`);
  redirect(`/admin/visites/${visit.id}`);
}

export async function updateVisit(id: string, _prevState: VisitFormState, formData: FormData): Promise<VisitFormState> {
  const user = await requireAdminUser();

  const existing = await prisma.visit.findUnique({ where: { id } });
  if (!existing) return { error: "Visite introuvable." };
  if (!canEditVisit(user.role, user.id, existing)) {
    return { error: "Vous n'avez pas le droit de modifier cette visite." };
  }

  const parsed = parseVisitForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  if (parsed.data.assignedToId) {
    const assignee = await prisma.user.findUnique({ where: { id: parsed.data.assignedToId }, select: { id: true } });
    if (!assignee) return { error: "Utilisateur assigné introuvable.", fieldErrors: { assignedToId: "Utilisateur introuvable." } };
  }

  const changedFields = diffVisitFields(
    {
      assignedToId: existing.assignedToId ?? undefined,
      scheduledStart: existing.scheduledStart.toISOString().slice(0, 16),
      scheduledEnd: existing.scheduledEnd ? existing.scheduledEnd.toISOString().slice(0, 16) : undefined,
      status: existing.status,
      type: existing.type,
      participantsCount: existing.participantsCount ?? undefined,
      postVisitInterest: existing.postVisitInterest ?? undefined,
      nextFollowUpAt: existing.nextFollowUpAt ? existing.nextFollowUpAt.toISOString().slice(0, 16) : undefined,
    } as Partial<VisitFormInput>,
    parsed.data
  );

  await prisma.visit.update({
    where: { id },
    data: {
      assignedToId: parsed.data.assignedToId ?? null,
      scheduledStart: new Date(parsed.data.scheduledStart),
      scheduledEnd: parsed.data.scheduledEnd ? new Date(parsed.data.scheduledEnd) : null,
      status: parsed.data.status,
      type: parsed.data.type,
      participantsCount: parsed.data.participantsCount ?? null,
      preVisitNote: parsed.data.preVisitNote ?? null,
      prospectFeedback: parsed.data.prospectFeedback ?? null,
      internalNote: parsed.data.internalNote ?? null,
      postVisitInterest: parsed.data.postVisitInterest ?? null,
      nextFollowUpAt: parsed.data.nextFollowUpAt ? new Date(parsed.data.nextFollowUpAt) : null,
    },
  });

  // Prospect funnel follows a REALISEE compte-rendu with strong post-visit interest.
  if (parsed.data.status === "REALISEE" && (parsed.data.postVisitInterest === "FORT" || parsed.data.postVisitInterest === "OFFRE_ENVISAGEE")) {
    await prisma.prospect.update({ where: { id: existing.prospectId }, data: { status: "NEGOCIATION" } }).catch(() => undefined);
  }

  // Field NAMES only — never note values.
  if (changedFields.length > 0) {
    await prisma.auditLog.create({
      data: { userId: user.id, action: "VISIT_UPDATED", entity: "Visit", entityId: id, metadata: { fieldsChanged: changedFields } },
    });
  }

  const newlyCancelled = parsed.data.status === "ANNULEE" && existing.status !== "ANNULEE";
  const meaningfulChange = changedFields.some((field) => ["scheduledStart", "scheduledEnd", "assignedToId", "status"].includes(field));

  if (newlyCancelled) {
    await notifyVisitCancelled({ id, reference: existing.reference, assignedToId: parsed.data.assignedToId ?? null });
  } else if (meaningfulChange) {
    await notifyVisitUpdated({
      id,
      reference: existing.reference,
      scheduledStart: new Date(parsed.data.scheduledStart),
      assignedToId: parsed.data.assignedToId ?? null,
    });
  }

  revalidatePath(`/admin/visites/${id}`);
  revalidatePath("/admin/visites");
  revalidatePath(`/admin/prospects/${existing.prospectId}`);
  revalidatePath(`/admin/biens/${existing.propertyId}`);
  redirect(`/admin/visites/${id}`);
}

/** Direct status transitions (Confirmer / Annuler / Absent…) exposed as small bound-form buttons on the detail page. */
export async function setVisitStatus(id: string, status: VisitStatusValue): Promise<void> {
  const user = await requireAdminUser();
  if (!visitStatusValues.includes(status)) redirect(`/admin/visites/${id}`);

  const visit = await prisma.visit.findUnique({ where: { id } });
  if (!visit) redirect("/admin/visites");
  if (!canEditVisit(user.role, user.id, visit)) {
    redirect(`/admin/visites/${id}?erreur=permission`);
  }

  await prisma.visit.update({ where: { id }, data: { status } });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "VISIT_STATUS_CHANGED", entity: "Visit", entityId: id, metadata: { status } },
  });

  if (status === "ANNULEE" && visit.status !== "ANNULEE") {
    await notifyVisitCancelled({ id, reference: visit.reference, assignedToId: visit.assignedToId });
  }

  revalidatePath(`/admin/visites/${id}`);
  revalidatePath("/admin/visites");
  revalidatePath(`/admin/prospects/${visit.prospectId}`);
  redirect(`/admin/visites/${id}`);
}
