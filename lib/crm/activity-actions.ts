"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminUser, type AuthenticatedUser } from "@/lib/auth/dal";
import { canCreateActivity, canEditActivity, canViewProspect } from "@/lib/crm/permissions";
import { parseActivityForm } from "@/lib/crm/activity-schema";
import { notifyActivityCreated } from "@/lib/crm/notification-service";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";

export type ActivityFormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

type ActivityContext = { prospectId: string; propertyId?: string | null; visitId?: string | null };

async function performCreateActivity(user: AuthenticatedUser, context: ActivityContext, formData: FormData): Promise<ActivityFormState> {
  if (!canCreateActivity(user.role)) {
    return { error: "Vous n'avez pas le droit de créer une action." };
  }

  const prospect = await prisma.prospect.findUnique({ where: { id: context.prospectId } });
  if (!prospect) return { error: "Prospect introuvable.", fieldErrors: { prospectId: "Prospect introuvable." } };
  if (!canViewProspect(user.role, user.id, prospect)) {
    return { error: "Vous n'avez pas accès à ce prospect.", fieldErrors: { prospectId: "Prospect inaccessible." } };
  }

  const parsed = parseActivityForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  if (parsed.data.assignedToId) {
    const assignee = await prisma.user.findUnique({ where: { id: parsed.data.assignedToId }, select: { id: true } });
    if (!assignee) return { error: "Utilisateur assigné introuvable.", fieldErrors: { assignedToId: "Utilisateur introuvable." } };
  }

  const activity = await prisma.activity.create({
    data: {
      prospectId: context.prospectId,
      propertyId: context.propertyId ?? undefined,
      visitId: context.visitId ?? undefined,
      type: parsed.data.type,
      title: parsed.data.title,
      content: parsed.data.content,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
      status: parsed.data.status,
      assignedToId: parsed.data.assignedToId ?? user.id,
      createdById: user.id,
    },
  });

  // Never log title/content — only structural fields.
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "ACTIVITY_CREATED",
      entity: "Activity",
      entityId: activity.id,
      metadata: { prospectId: context.prospectId, type: activity.type, status: activity.status },
    },
  });

  await notifyActivityCreated({
    id: activity.id,
    prospectId: context.prospectId,
    prospectReference: prospect.reference,
    assignedToId: activity.assignedToId,
    dueAt: activity.dueAt,
    status: activity.status,
  });

  revalidatePath(`/admin/prospects/${context.prospectId}`);
  revalidatePath("/admin/actions");
  if (context.visitId) revalidatePath(`/admin/visites/${context.visitId}`);
  return undefined;
}

/**
 * Quick-create used from the prospect 360° and the visit detail's "prochaine
 * relance" shortcut, context pre-bound by the caller. Never redirects —
 * callers revalidate the page they were on.
 */
export async function createActivity(context: ActivityContext, _prevState: ActivityFormState, formData: FormData): Promise<ActivityFormState> {
  const user = await requireAdminUser();
  return performCreateActivity(user, context, formData);
}

/** Same as createActivity, but reads prospectId from the form itself — used by the standalone /admin/actions screen. */
export async function createStandaloneActivity(_prevState: ActivityFormState, formData: FormData): Promise<ActivityFormState> {
  const user = await requireAdminUser();
  const prospectId = String(formData.get("prospectId") ?? "").trim();
  if (!prospectId) return { error: "Merci de choisir un prospect.", fieldErrors: { prospectId: "Prospect requis." } };
  return performCreateActivity(user, { prospectId }, formData);
}

/**
 * Marks an activity done and redirects to /admin/aujourd-hui with a prompt to
 * create the next relance for the same prospect — used from that screen's
 * "Terminer" button only (see the 6H1 brief's "proposer 'Créer une prochaine
 * relance'"). Other screens keep using the plain setActivityStatus below,
 * which never redirects.
 */
export async function completeActivityWithFollowUp(id: string, prospectId: string): Promise<void> {
  const user = await requireAdminUser();

  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) redirect("/admin/aujourd-hui");
  if (!canEditActivity(user.role, user.id, activity)) {
    redirect("/admin/aujourd-hui?erreur=permission");
  }

  await prisma.activity.update({ where: { id }, data: { status: "TERMINEE", completedAt: new Date() } });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "ACTIVITY_STATUS_CHANGED", entity: "Activity", entityId: id, metadata: { status: "TERMINEE" } },
  });

  revalidatePath(`/admin/prospects/${activity.prospectId}`);
  revalidatePath("/admin/actions");
  revalidatePath("/admin/aujourd-hui");
  if (activity.visitId) revalidatePath(`/admin/visites/${activity.visitId}`);
  redirect(`/admin/aujourd-hui?prochaine=${prospectId}`);
}

/** Marks an action as done/cancelled from any screen listing it (prospect 360°, visit detail, /admin/actions). */
export async function setActivityStatus(id: string, status: "TERMINEE" | "ANNULEE" | "A_FAIRE"): Promise<void> {
  const user = await requireAdminUser();

  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) redirect("/admin/actions");
  if (!canEditActivity(user.role, user.id, activity)) {
    redirect(`/admin/actions?erreur=permission`);
  }

  await prisma.activity.update({
    where: { id },
    data: { status, completedAt: status === "TERMINEE" ? new Date() : null },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "ACTIVITY_STATUS_CHANGED", entity: "Activity", entityId: id, metadata: { status } },
  });

  revalidatePath(`/admin/prospects/${activity.prospectId}`);
  revalidatePath("/admin/actions");
  if (activity.visitId) revalidatePath(`/admin/visites/${activity.visitId}`);
}
