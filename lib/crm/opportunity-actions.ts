"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth/dal";
import {
  canCreateOpportunity,
  canEditOpportunity,
  canViewProspect,
  canViewVisit,
  canEditVisit,
  canOverrideOpportunityProbability,
  canReopenOpportunity,
} from "@/lib/crm/permissions";
import { canManageFinance } from "@/lib/finance/permissions";
import {
  parseOpportunityForm,
  parseOpportunityStageChange,
  initialStageSchema,
  probabilityOverrideSchema,
  type OpportunityFormInput,
} from "@/lib/crm/opportunity-schema";
import {
  defaultStageProbability,
  isClosedStage,
  stageRequiresProperty,
  opportunityStageLabels,
  type OpportunityStageValue,
} from "@/lib/crm/opportunity-rules";
import { generateNextOpportunityReference } from "@/lib/crm/reference";
import { notifyOpportunityAssigned, notifyOpportunityStageChanged } from "@/lib/crm/notification-service";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";

/**
 * Server Actions for the Opportunity pipeline (phase 6L). Every action
 * re-checks lib/crm/permissions.ts itself — the UI only hides buttons.
 *
 * AuditLog.metadata: ids, stages, enum transaction and field NAMES only —
 * never estimatedAmount/finalAmount/probability/internalNote/lossReason/lossNote.
 *
 * Winning an opportunity never creates a CommissionCase: the detail page
 * only PROPOSES "Créer le dossier de commission" to SUPER_ADMIN/ADMIN.
 */

export type OpportunityFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
      success?: string;
    }
  | undefined;

function parseDateOnly(value: string): Date {
  // Noon local time keeps the calendar day stable across time zones.
  return new Date(`${value}T12:00:00`);
}

async function validateAssignee(assignedToId: string | undefined): Promise<boolean> {
  if (!assignedToId) return true;
  const assignee = await prisma.user.findUnique({ where: { id: assignedToId }, select: { id: true } });
  return Boolean(assignee);
}

function revalidateOpportunity(opportunity: { id: string; prospectId: string; propertyId: string | null }) {
  revalidatePath("/admin/opportunites");
  revalidatePath(`/admin/opportunites/${opportunity.id}`);
  revalidatePath(`/admin/prospects/${opportunity.prospectId}`);
  if (opportunity.propertyId) revalidatePath(`/admin/biens/${opportunity.propertyId}`);
  revalidatePath("/admin");
}

// --- Create -------------------------------------------------------------------

export async function createOpportunity(_prevState: OpportunityFormState, formData: FormData): Promise<OpportunityFormState> {
  const user = await requireAdminUser();
  if (!canCreateOpportunity(user.role)) {
    return { error: "Vous n'avez pas le droit de créer une opportunité." };
  }

  const prospectId = String(formData.get("prospectId") ?? "").trim();
  if (!prospectId) return { error: "Merci de choisir un prospect.", fieldErrors: { prospectId: "Prospect requis." } };

  const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
  if (!prospect) return { error: "Prospect introuvable.", fieldErrors: { prospectId: "Prospect introuvable." } };
  if (!canViewProspect(user.role, user.id, prospect)) {
    return { error: "Vous n'avez pas accès à ce prospect.", fieldErrors: { prospectId: "Prospect inaccessible." } };
  }

  const parsed = parseOpportunityForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  const stageParsed = initialStageSchema.safeParse(formData.get("stage"));
  if (!stageParsed.success) return { error: "Stade initial invalide.", fieldErrors: { stage: "Stade initial invalide." } };
  const stage = stageParsed.data as OpportunityStageValue;

  // Optional source visit (created from a "visite réalisée").
  const visitId = String(formData.get("visitId") ?? "").trim() || undefined;
  let propertyId = data.propertyId;
  if (visitId) {
    const visit = await prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit || visit.prospectId !== prospectId || !canViewVisit(user.role, user.id, visit)) {
      return { error: "Visite source invalide pour ce prospect." };
    }
    if (visit.opportunityId) return { error: "Cette visite est déjà rattachée à une opportunité." };
    propertyId = propertyId ?? visit.propertyId;
  }

  if (propertyId) {
    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } });
    if (!property) return { error: "Bien introuvable.", fieldErrors: { propertyId: "Bien introuvable." } };
  }
  if (stageRequiresProperty(stage) && !propertyId) {
    return {
      error: `Un bien est obligatoire à partir du stade « ${opportunityStageLabels.VISITE} ».`,
      fieldErrors: { propertyId: "Bien requis pour ce stade." },
    };
  }

  if (!(await validateAssignee(data.assignedToId))) {
    return { error: "Utilisateur assigné introuvable.", fieldErrors: { assignedToId: "Utilisateur introuvable." } };
  }
  const assignedToId = data.assignedToId ?? user.id;

  const reference = await generateNextOpportunityReference();

  const opportunity = await prisma.$transaction(async (tx) => {
    const created = await tx.opportunity.create({
      data: {
        reference,
        prospectId,
        propertyId,
        transaction: data.transaction,
        title: data.title,
        stage,
        estimatedAmount: data.estimatedAmount,
        currency: data.currency ?? "MAD",
        probability: defaultStageProbability[stage],
        expectedCloseDate: data.expectedCloseDate ? parseDateOnly(data.expectedCloseDate) : undefined,
        internalNote: data.internalNote,
        assignedToId,
        createdById: user.id,
      },
    });
    await tx.opportunityStageHistory.create({
      data: { opportunityId: created.id, fromStage: null, toStage: stage, changedById: user.id },
    });
    if (visitId) {
      await tx.visit.update({ where: { id: visitId }, data: { opportunityId: created.id } });
    }
    return created;
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "OPPORTUNITY_CREATED",
      entity: "Opportunity",
      entityId: opportunity.id,
      metadata: {
        prospectId,
        propertyId: propertyId ?? null,
        visitId: visitId ?? null,
        stage,
        transaction: data.transaction,
        assignedToId,
      },
    },
  });

  await notifyOpportunityAssigned(opportunity, assignedToId, user.id);

  revalidateOpportunity(opportunity);
  if (visitId) revalidatePath(`/admin/visites/${visitId}`);
  redirect(`/admin/opportunites/${opportunity.id}`);
}

// --- Edit ---------------------------------------------------------------------

export async function updateOpportunity(id: string, _prevState: OpportunityFormState, formData: FormData): Promise<OpportunityFormState> {
  const user = await requireAdminUser();

  const existing = await prisma.opportunity.findUnique({ where: { id } });
  if (!existing) return { error: "Opportunité introuvable." };
  if (!canEditOpportunity(user.role, user.id, existing)) {
    return { error: "Vous n'avez pas le droit de modifier cette opportunité." };
  }
  if (isClosedStage(existing.stage) && !canReopenOpportunity(user.role)) {
    return { error: "Opportunité clôturée : seuls les administrateurs peuvent la modifier." };
  }

  const parsed = parseOpportunityForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  if (data.propertyId) {
    const property = await prisma.property.findUnique({ where: { id: data.propertyId }, select: { id: true } });
    if (!property) return { error: "Bien introuvable.", fieldErrors: { propertyId: "Bien introuvable." } };
  }
  if (stageRequiresProperty(existing.stage) && !data.propertyId) {
    return {
      error: `Un bien est obligatoire au stade « ${opportunityStageLabels[existing.stage]} ».`,
      fieldErrors: { propertyId: "Bien requis pour ce stade." },
    };
  }
  if (!(await validateAssignee(data.assignedToId))) {
    return { error: "Utilisateur assigné introuvable.", fieldErrors: { assignedToId: "Utilisateur introuvable." } };
  }

  const before: Record<keyof OpportunityFormInput, string> = {
    propertyId: existing.propertyId ?? "",
    transaction: existing.transaction,
    title: existing.title,
    estimatedAmount: existing.estimatedAmount === null ? "" : String(Number(existing.estimatedAmount)),
    currency: existing.currency,
    expectedCloseDate: existing.expectedCloseDate ? existing.expectedCloseDate.toISOString().slice(0, 10) : "",
    assignedToId: existing.assignedToId ?? "",
    internalNote: existing.internalNote ?? "",
  };
  const after: Record<keyof OpportunityFormInput, string> = {
    propertyId: data.propertyId ?? "",
    transaction: data.transaction,
    title: data.title,
    estimatedAmount: data.estimatedAmount === undefined ? "" : String(data.estimatedAmount),
    currency: data.currency ?? "MAD",
    expectedCloseDate: data.expectedCloseDate ?? "",
    assignedToId: data.assignedToId ?? "",
    internalNote: data.internalNote ?? "",
  };
  const fieldsChanged = (Object.keys(after) as (keyof OpportunityFormInput)[]).filter((field) => before[field] !== after[field]);

  await prisma.opportunity.update({
    where: { id },
    data: {
      propertyId: data.propertyId ?? null,
      transaction: data.transaction,
      title: data.title,
      estimatedAmount: data.estimatedAmount ?? null,
      currency: data.currency ?? "MAD",
      expectedCloseDate: data.expectedCloseDate ? parseDateOnly(data.expectedCloseDate) : null,
      assignedToId: data.assignedToId ?? null,
      internalNote: data.internalNote ?? null,
      lastActivityAt: new Date(),
    },
  });

  // Field NAMES only — never amounts or note content.
  if (fieldsChanged.length > 0) {
    await prisma.auditLog.create({
      data: { userId: user.id, action: "OPPORTUNITY_UPDATED", entity: "Opportunity", entityId: id, metadata: { fieldsChanged } },
    });
  }

  if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
    await notifyOpportunityAssigned(existing, data.assignedToId, user.id);
  }

  revalidateOpportunity({ id, prospectId: existing.prospectId, propertyId: data.propertyId ?? null });
  if (existing.propertyId && existing.propertyId !== data.propertyId) revalidatePath(`/admin/biens/${existing.propertyId}`);
  return { success: "Opportunité enregistrée." };
}

// --- Stage --------------------------------------------------------------------

/**
 * The only way an opportunity changes stage — used by the detail page form
 * and by the Kanban board (which only moves a card once this returns
 * `success`). Enforces: bien required from VISITE; GAGNEE requires bien +
 * final amount + closing date; PERDUE requires a loss reason; reopening a
 * GAGNEE/PERDUE opportunity is SUPER_ADMIN/ADMIN only.
 */
export async function changeOpportunityStage(id: string, _prevState: OpportunityFormState, formData: FormData): Promise<OpportunityFormState> {
  const user = await requireAdminUser();

  const existing = await prisma.opportunity.findUnique({ where: { id } });
  if (!existing) return { error: "Opportunité introuvable." };
  if (!canEditOpportunity(user.role, user.id, existing)) {
    return { error: "Vous n'avez pas le droit de modifier cette opportunité." };
  }

  const parsed = parseOpportunityStageChange(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }
  const data = parsed.data;
  const toStage = data.stage;

  if (toStage === existing.stage) return { error: `L'opportunité est déjà au stade « ${opportunityStageLabels[toStage]} ».` };
  if (isClosedStage(existing.stage) && !canReopenOpportunity(user.role)) {
    return { error: "Opportunité clôturée : seul un administrateur peut la rouvrir ou la modifier." };
  }
  if (stageRequiresProperty(toStage) && !existing.propertyId) {
    return {
      error: `Rattachez d'abord un bien : il est obligatoire à partir du stade « ${opportunityStageLabels.VISITE} ».`,
      fieldErrors: { stage: "Bien requis pour ce stade." },
    };
  }

  const now = new Date();
  const closingData =
    toStage === "GAGNEE"
      ? { finalAmount: data.finalAmount, closedAt: parseDateOnly(data.closedAt!), lossReason: null, lossNote: null }
      : toStage === "PERDUE"
        ? { closedAt: data.closedAt ? parseDateOnly(data.closedAt) : now, lossReason: data.lossReason, lossNote: data.lossNote ?? null }
        : { closedAt: null, lossReason: null, lossNote: null };

  await prisma.$transaction([
    prisma.opportunity.update({
      where: { id },
      data: {
        stage: toStage,
        probability: defaultStageProbability[toStage],
        probabilityIsManual: false,
        stageChangedAt: now,
        lastActivityAt: now,
        ...closingData,
      },
    }),
    prisma.opportunityStageHistory.create({
      data: { opportunityId: id, fromStage: existing.stage, toStage, changedById: user.id },
    }),
  ]);

  // Stage transition only — never finalAmount, lossReason or lossNote.
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "OPPORTUNITY_STAGE_CHANGED",
      entity: "Opportunity",
      entityId: id,
      metadata: { fromStage: existing.stage, toStage },
    },
  });

  await notifyOpportunityStageChanged(existing, toStage, user.id);

  revalidateOpportunity(existing);
  return {
    success:
      toStage === "GAGNEE"
        ? "Opportunité gagnée. Pensez à créer ou lier le dossier de commission."
        : `Stade mis à jour : ${opportunityStageLabels[toStage]}.`,
  };
}

// --- Probability (SUPER_ADMIN / ADMIN) ----------------------------------------

export async function overrideOpportunityProbability(id: string, _prevState: OpportunityFormState, formData: FormData): Promise<OpportunityFormState> {
  const user = await requireAdminUser();
  if (!canOverrideOpportunityProbability(user.role)) {
    return { error: "Seul un administrateur peut ajuster la probabilité." };
  }
  const existing = await prisma.opportunity.findUnique({ where: { id }, select: { id: true, prospectId: true, propertyId: true, stage: true } });
  if (!existing) return { error: "Opportunité introuvable." };
  if (isClosedStage(existing.stage)) return { error: "La probabilité d'une opportunité clôturée est fixe (100 % gagnée, 0 % perdue)." };

  const reset = formData.get("reset") === "1";
  let probability = defaultStageProbability[existing.stage];
  if (!reset) {
    const parsed = probabilityOverrideSchema.safeParse({ probability: formData.get("probability") });
    if (!parsed.success) return { error: "Probabilité invalide.", fieldErrors: zodFieldErrors(parsed.error) };
    probability = parsed.data.probability;
  }

  await prisma.opportunity.update({ where: { id }, data: { probability, probabilityIsManual: !reset } });

  // The value itself is never logged.
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: reset ? "OPPORTUNITY_PROBABILITY_RESET" : "OPPORTUNITY_PROBABILITY_OVERRIDDEN",
      entity: "Opportunity",
      entityId: id,
      metadata: { stage: existing.stage },
    },
  });

  revalidateOpportunity(existing);
  return { success: reset ? "Probabilité par défaut du stade rétablie." : "Probabilité ajustée." };
}

// --- Visits -------------------------------------------------------------------

export async function linkVisitToOpportunity(opportunityId: string, formData: FormData): Promise<void> {
  const user = await requireAdminUser();
  const visitId = String(formData.get("visitId") ?? "").trim();
  const returnToVisit = formData.get("returnTo") === "visit";

  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) redirect("/admin/opportunites");
  const back = returnToVisit && visitId ? `/admin/visites/${visitId}` : `/admin/opportunites/${opportunityId}`;
  if (!canEditOpportunity(user.role, user.id, opportunity)) redirect(`${back}?erreur=permission`);

  const visit = visitId ? await prisma.visit.findUnique({ where: { id: visitId } }) : null;
  if (!visit || visit.prospectId !== opportunity.prospectId || !canViewVisit(user.role, user.id, visit)) {
    redirect(`${back}?erreur=visite`);
  }

  await prisma.visit.update({ where: { id: visit.id }, data: { opportunityId } });
  await prisma.opportunity.update({ where: { id: opportunityId }, data: { lastActivityAt: new Date() } });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "OPPORTUNITY_VISIT_LINKED", entity: "Opportunity", entityId: opportunityId, metadata: { visitId: visit.id } },
  });

  revalidateOpportunity(opportunity);
  revalidatePath(`/admin/visites/${visit.id}`);
  if (visit.opportunityId && visit.opportunityId !== opportunityId) revalidatePath(`/admin/opportunites/${visit.opportunityId}`);
  redirect(back);
}

export async function unlinkVisitFromOpportunity(opportunityId: string, visitId: string): Promise<void> {
  const user = await requireAdminUser();

  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) redirect("/admin/opportunites");
  if (!canEditOpportunity(user.role, user.id, opportunity)) redirect(`/admin/opportunites/${opportunityId}?erreur=permission`);

  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit || visit.opportunityId !== opportunityId || !canEditVisit(user.role, user.id, visit)) {
    redirect(`/admin/opportunites/${opportunityId}?erreur=permission`);
  }

  await prisma.visit.update({ where: { id: visitId }, data: { opportunityId: null } });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "OPPORTUNITY_VISIT_UNLINKED", entity: "Opportunity", entityId: opportunityId, metadata: { visitId } },
  });

  revalidateOpportunity(opportunity);
  revalidatePath(`/admin/visites/${visitId}`);
}

// --- Commission dossiers (SUPER_ADMIN / ADMIN) --------------------------------

export async function linkCommissionCaseToOpportunity(opportunityId: string, formData: FormData): Promise<void> {
  const user = await requireAdminUser();
  if (!canManageFinance(user.role)) redirect(`/admin/opportunites/${opportunityId}?erreur=permission`);

  const commissionCaseId = String(formData.get("commissionCaseId") ?? "").trim();
  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) redirect("/admin/opportunites");

  const commissionCase = commissionCaseId ? await prisma.commissionCase.findUnique({ where: { id: commissionCaseId } }) : null;
  if (!commissionCase || commissionCase.opportunityId || !opportunity.propertyId || commissionCase.propertyId !== opportunity.propertyId) {
    redirect(`/admin/opportunites/${opportunityId}?erreur=commission`);
  }

  await prisma.commissionCase.update({ where: { id: commissionCase.id }, data: { opportunityId } });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "OPPORTUNITY_COMMISSION_LINKED",
      entity: "Opportunity",
      entityId: opportunityId,
      metadata: { commissionCaseId: commissionCase.id },
    },
  });

  revalidateOpportunity(opportunity);
  revalidatePath(`/admin/commissions/${commissionCase.id}`);
}

export async function unlinkCommissionCaseFromOpportunity(opportunityId: string, commissionCaseId: string): Promise<void> {
  const user = await requireAdminUser();
  if (!canManageFinance(user.role)) redirect(`/admin/opportunites/${opportunityId}?erreur=permission`);

  const commissionCase = await prisma.commissionCase.findUnique({ where: { id: commissionCaseId } });
  if (!commissionCase || commissionCase.opportunityId !== opportunityId) redirect(`/admin/opportunites/${opportunityId}?erreur=commission`);

  await prisma.commissionCase.update({ where: { id: commissionCaseId }, data: { opportunityId: null } });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "OPPORTUNITY_COMMISSION_UNLINKED",
      entity: "Opportunity",
      entityId: opportunityId,
      metadata: { commissionCaseId },
    },
  });

  revalidatePath(`/admin/opportunites/${opportunityId}`);
  revalidatePath(`/admin/commissions/${commissionCaseId}`);
}

