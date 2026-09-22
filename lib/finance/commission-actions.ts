"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageFinance } from "@/lib/finance/permissions";
import {
  parseCommissionCaseForm,
  parseCommissionShareForm,
  parseCommissionPaymentForm,
} from "@/lib/finance/commission-schema";
import { commissionCaseStatusValues, type CommissionCaseStatusValue } from "@/lib/finance/enum-labels";
import { generateNextCommissionReference } from "@/lib/finance/reference";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";

export type CommissionCaseFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
    }
  | undefined;

export type CommissionShareFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
    }
  | undefined;

export type CommissionPaymentFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
    }
  | undefined;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

async function assertCanManage() {
  const user = await requireAdminUser();
  if (!canManageFinance(user.role)) {
    return { ok: false as const, error: "Vous n'avez pas le droit de gérer les mandats et commissions." };
  }
  return { ok: true as const, user };
}

// --- CommissionCase ---------------------------------------------------------

export async function createCommissionCase(
  propertyId: string,
  _prevState: CommissionCaseFormState,
  formData: FormData
): Promise<CommissionCaseFormState> {
  const gate = await assertCanManage();
  if (!gate.ok) return { error: gate.error };

  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } });
  if (!property) return { error: "Bien introuvable." };

  const parsed = parseCommissionCaseForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  let mandateId: string | undefined;
  if (data.mandateId) {
    const mandate = await prisma.mandate.findUnique({ where: { id: data.mandateId } });
    if (!mandate || mandate.propertyId !== propertyId) {
      return { error: "Mandat invalide pour ce bien.", fieldErrors: { mandateId: "Mandat invalide pour ce bien." } };
    }
    mandateId = mandate.id;
  }

  const agencyCommissionAmount =
    data.agencyCommissionRate !== undefined
      ? round2((data.agencyCommissionRate / 100) * data.baseAmount)
      : (data.agencyCommissionAmountInput as number);

  const reference = await generateNextCommissionReference();

  const commissionCase = await prisma.commissionCase.create({
    data: {
      reference,
      propertyId,
      mandateId,
      transaction: data.transaction,
      status: data.status,
      basis: data.basis,
      baseAmount: data.baseAmount,
      agencyCommissionRate: data.agencyCommissionRate,
      agencyCommissionAmount,
      billedTo: data.billedTo,
      currency: data.currency ?? "MAD",
      finalTransactionAmount: data.finalTransactionAmount,
      expectedCollectionDate: data.expectedCollectionDate ? new Date(data.expectedCollectionDate) : undefined,
      internalNotes: data.internalNotes,
      createdById: gate.user.id,
    },
  });

  // Structural fields only — never baseAmount/rate/amount/notes.
  await prisma.auditLog.create({
    data: {
      userId: gate.user.id,
      action: "COMMISSION_CASE_CREATED",
      entity: "CommissionCase",
      entityId: commissionCase.id,
      metadata: { propertyId, mandateId: mandateId ?? null, transaction: commissionCase.transaction, status: commissionCase.status },
    },
  });

  revalidatePath("/admin/commissions");
  revalidatePath(`/admin/biens/${propertyId}`);
  if (mandateId) revalidatePath(`/admin/mandats/${mandateId}`);
  redirect(`/admin/commissions/${commissionCase.id}`);
}

export async function updateCommissionCase(
  id: string,
  _prevState: CommissionCaseFormState,
  formData: FormData
): Promise<CommissionCaseFormState> {
  const gate = await assertCanManage();
  if (!gate.ok) return { error: gate.error };

  const existing = await prisma.commissionCase.findUnique({ where: { id }, include: { shares: true } });
  if (!existing) return { error: "Dossier de commission introuvable." };

  const parsed = parseCommissionCaseForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  let mandateId: string | undefined;
  if (data.mandateId) {
    const mandate = await prisma.mandate.findUnique({ where: { id: data.mandateId } });
    if (!mandate || mandate.propertyId !== existing.propertyId) {
      return { error: "Mandat invalide pour ce bien.", fieldErrors: { mandateId: "Mandat invalide pour ce bien." } };
    }
    mandateId = mandate.id;
  }

  const agencyCommissionAmount =
    data.agencyCommissionRate !== undefined
      ? round2((data.agencyCommissionRate / 100) * data.baseAmount)
      : (data.agencyCommissionAmountInput as number);

  const sharesTotal = existing.shares.reduce((sum, share) => sum + Number(share.computedAmount), 0);
  if (sharesTotal > agencyCommissionAmount) {
    return {
      error: `Impossible : les parts déjà réparties (${sharesTotal}) dépasseraient la nouvelle commission agence (${agencyCommissionAmount}). Ajustez d'abord les parts.`,
      fieldErrors: { agencyCommissionAmountInput: "Insuffisant pour couvrir les parts existantes." },
    };
  }

  await prisma.commissionCase.update({
    where: { id },
    data: {
      mandateId: mandateId ?? null,
      transaction: data.transaction,
      status: data.status,
      basis: data.basis,
      baseAmount: data.baseAmount,
      agencyCommissionRate: data.agencyCommissionRate ?? null,
      agencyCommissionAmount,
      billedTo: data.billedTo ?? null,
      currency: data.currency ?? "MAD",
      finalTransactionAmount: data.finalTransactionAmount ?? null,
      expectedCollectionDate: data.expectedCollectionDate ? new Date(data.expectedCollectionDate) : null,
      internalNotes: data.internalNotes ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: gate.user.id,
      action: "COMMISSION_CASE_UPDATED",
      entity: "CommissionCase",
      entityId: id,
      metadata: { transaction: data.transaction, status: data.status },
    },
  });

  revalidatePath(`/admin/commissions/${id}`);
  revalidatePath("/admin/commissions");
  revalidatePath(`/admin/biens/${existing.propertyId}`);
  redirect(`/admin/commissions/${id}`);
}

/** Manual status transitions (À confirmer / Due / Annulée…) available as bound-form buttons on the detail page. */
export async function setCommissionCaseStatus(id: string, status: CommissionCaseStatusValue): Promise<void> {
  const user = await requireAdminUser();
  if (!canManageFinance(user.role)) {
    redirect(`/admin/commissions/${id}?erreur=permission`);
  }
  if (!commissionCaseStatusValues.includes(status)) {
    redirect(`/admin/commissions/${id}`);
  }

  const commissionCase = await prisma.commissionCase.findUnique({ where: { id } });
  if (!commissionCase) redirect("/admin/commissions");

  await prisma.commissionCase.update({ where: { id }, data: { status } });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "COMMISSION_CASE_STATUS_CHANGED", entity: "CommissionCase", entityId: id, metadata: { status } },
  });

  revalidatePath(`/admin/commissions/${id}`);
  revalidatePath("/admin/commissions");
  revalidatePath(`/admin/biens/${commissionCase.propertyId}`);
  redirect(`/admin/commissions/${id}`);
}

// --- CommissionShare ---------------------------------------------------------

function computeShareAmount(mode: "POURCENTAGE" | "MONTANT_FIXE", value: number, agencyCommissionAmount: number): number {
  return mode === "MONTANT_FIXE" ? round2(value) : round2((value / 100) * agencyCommissionAmount);
}

export async function addCommissionShare(
  commissionCaseId: string,
  _prevState: CommissionShareFormState,
  formData: FormData
): Promise<CommissionShareFormState> {
  const gate = await assertCanManage();
  if (!gate.ok) return { error: gate.error };

  const commissionCase = await prisma.commissionCase.findUnique({ where: { id: commissionCaseId }, include: { shares: true } });
  if (!commissionCase) return { error: "Dossier de commission introuvable." };

  const parsed = parseCommissionShareForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  if (data.intermediaryId) {
    const intermediary = await prisma.intermediary.findUnique({ where: { id: data.intermediaryId } });
    if (!intermediary) return { error: "Intermédiaire introuvable.", fieldErrors: { intermediaryId: "Intermédiaire introuvable." } };
  }
  if (data.userId) {
    const beneficiaryUser = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!beneficiaryUser) return { error: "Agent introuvable.", fieldErrors: { userId: "Agent introuvable." } };
  }

  const agencyAmount = Number(commissionCase.agencyCommissionAmount);
  const computedAmount = computeShareAmount(data.mode, data.value, agencyAmount);
  const existingTotal = commissionCase.shares.reduce((sum, share) => sum + Number(share.computedAmount), 0);

  if (existingTotal + computedAmount > agencyAmount) {
    return {
      error: `Le total des parts (${round2(existingTotal + computedAmount)}) dépasserait la commission agence (${agencyAmount}). Reste disponible : ${round2(agencyAmount - existingTotal)}.`,
      fieldErrors: { value: "Dépasse la commission agence disponible." },
    };
  }

  await prisma.commissionShare.create({
    data: {
      commissionCaseId,
      beneficiaryType: data.beneficiaryType,
      intermediaryId: data.beneficiaryType === "INTERMEDIAIRE" ? data.intermediaryId : undefined,
      userId: data.beneficiaryType === "AGENT_INTERNE" ? data.userId : undefined,
      freeBeneficiaryName: data.beneficiaryType === "AUTRE" ? data.freeBeneficiaryName : undefined,
      mode: data.mode,
      value: data.value,
      computedAmount,
      status: data.status,
      notes: data.notes,
    },
  });

  // Never log value/computedAmount/notes — beneficiary type + mode only.
  await prisma.auditLog.create({
    data: {
      userId: gate.user.id,
      action: "COMMISSION_SHARE_CREATED",
      entity: "CommissionCase",
      entityId: commissionCaseId,
      metadata: { beneficiaryType: data.beneficiaryType, mode: data.mode },
    },
  });

  revalidatePath(`/admin/commissions/${commissionCaseId}`);
}

export async function updateCommissionShare(
  shareId: string,
  _prevState: CommissionShareFormState,
  formData: FormData
): Promise<CommissionShareFormState> {
  const gate = await assertCanManage();
  if (!gate.ok) return { error: gate.error };

  const share = await prisma.commissionShare.findUnique({
    where: { id: shareId },
    include: { commissionCase: { include: { shares: true } } },
  });
  if (!share) return { error: "Part introuvable." };

  const parsed = parseCommissionShareForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  if (data.intermediaryId) {
    const intermediary = await prisma.intermediary.findUnique({ where: { id: data.intermediaryId } });
    if (!intermediary) return { error: "Intermédiaire introuvable.", fieldErrors: { intermediaryId: "Intermédiaire introuvable." } };
  }
  if (data.userId) {
    const beneficiaryUser = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!beneficiaryUser) return { error: "Agent introuvable.", fieldErrors: { userId: "Agent introuvable." } };
  }

  const agencyAmount = Number(share.commissionCase.agencyCommissionAmount);
  const computedAmount = computeShareAmount(data.mode, data.value, agencyAmount);
  const othersTotal = share.commissionCase.shares
    .filter((other) => other.id !== shareId)
    .reduce((sum, other) => sum + Number(other.computedAmount), 0);

  if (othersTotal + computedAmount > agencyAmount) {
    return {
      error: `Le total des parts (${round2(othersTotal + computedAmount)}) dépasserait la commission agence (${agencyAmount}). Reste disponible : ${round2(agencyAmount - othersTotal)}.`,
      fieldErrors: { value: "Dépasse la commission agence disponible." },
    };
  }

  await prisma.commissionShare.update({
    where: { id: shareId },
    data: {
      beneficiaryType: data.beneficiaryType,
      intermediaryId: data.beneficiaryType === "INTERMEDIAIRE" ? data.intermediaryId : null,
      userId: data.beneficiaryType === "AGENT_INTERNE" ? data.userId : null,
      freeBeneficiaryName: data.beneficiaryType === "AUTRE" ? data.freeBeneficiaryName : null,
      mode: data.mode,
      value: data.value,
      computedAmount,
      status: data.status,
      notes: data.notes ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: gate.user.id,
      action: "COMMISSION_SHARE_UPDATED",
      entity: "CommissionCase",
      entityId: share.commissionCaseId,
      metadata: { beneficiaryType: data.beneficiaryType, mode: data.mode },
    },
  });

  revalidatePath(`/admin/commissions/${share.commissionCaseId}`);
}

/** A share with at least one payment attached is never deleted — same "no physical delete once it matters" rule as the rest of the module. */
export async function removeCommissionShare(shareId: string): Promise<void> {
  const gate = await assertCanManage();
  if (!gate.ok) return;

  const share = await prisma.commissionShare.findUnique({ where: { id: shareId }, include: { payments: true } });
  if (!share) return;

  if (share.payments.length > 0) {
    redirect(`/admin/commissions/${share.commissionCaseId}?erreur=part-avec-paiements`);
  }

  await prisma.commissionShare.delete({ where: { id: shareId } });

  await prisma.auditLog.create({
    data: {
      userId: gate.user.id,
      action: "COMMISSION_SHARE_REMOVED",
      entity: "CommissionCase",
      entityId: share.commissionCaseId,
      metadata: { beneficiaryType: share.beneficiaryType },
    },
  });

  revalidatePath(`/admin/commissions/${share.commissionCaseId}`);
}

// --- CommissionPayment -------------------------------------------------------

const PAID_STATUSES = ["RECU", "PARTIEL"] as const;

async function recomputeCommissionCaseStatus(commissionCaseId: string) {
  const commissionCase = await prisma.commissionCase.findUnique({ where: { id: commissionCaseId } });
  if (!commissionCase || commissionCase.status === "ANNULEE") return;

  const paidAggregate = await prisma.commissionPayment.aggregate({
    where: { commissionCaseId, status: { in: [...PAID_STATUSES] } },
    _sum: { amount: true },
  });
  const totalPaid = Number(paidAggregate._sum.amount ?? 0);
  const due = Number(commissionCase.agencyCommissionAmount);

  let nextStatus: CommissionCaseStatusValue | null = null;
  if (due > 0 && totalPaid >= due) nextStatus = "PAYEE";
  else if (totalPaid > 0) nextStatus = "PARTIELLEMENT_PAYEE";
  else if (commissionCase.status === "PAYEE" || commissionCase.status === "PARTIELLEMENT_PAYEE") nextStatus = "DUE";

  if (nextStatus && nextStatus !== commissionCase.status) {
    await prisma.commissionCase.update({ where: { id: commissionCaseId }, data: { status: nextStatus } });
  }
}

async function recomputeCommissionShareStatus(commissionShareId: string) {
  const share = await prisma.commissionShare.findUnique({ where: { id: commissionShareId } });
  if (!share) return;

  const paidAggregate = await prisma.commissionPayment.aggregate({
    where: { commissionShareId, status: { in: [...PAID_STATUSES] } },
    _sum: { amount: true },
  });
  const totalPaid = Number(paidAggregate._sum.amount ?? 0);
  const due = Number(share.computedAmount);

  let nextStatus: "PREVU" | "VALIDE" | "PAYE" | null = null;
  if (due > 0 && totalPaid >= due) nextStatus = "PAYE";
  else if (share.status === "PAYE") nextStatus = "VALIDE";

  if (nextStatus && nextStatus !== share.status) {
    await prisma.commissionShare.update({ where: { id: commissionShareId }, data: { status: nextStatus } });
  }
}

export async function addCommissionPayment(
  commissionCaseId: string,
  _prevState: CommissionPaymentFormState,
  formData: FormData
): Promise<CommissionPaymentFormState> {
  const gate = await assertCanManage();
  if (!gate.ok) return { error: gate.error };

  const commissionCase = await prisma.commissionCase.findUnique({ where: { id: commissionCaseId } });
  if (!commissionCase) return { error: "Dossier de commission introuvable." };

  const parsed = parseCommissionPaymentForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  let share = null;
  if (data.commissionShareId) {
    share = await prisma.commissionShare.findUnique({ where: { id: data.commissionShareId } });
    if (!share || share.commissionCaseId !== commissionCaseId) {
      return { error: "Part invalide pour ce dossier.", fieldErrors: { commissionShareId: "Part invalide pour ce dossier." } };
    }
  }

  const due = share ? Number(share.computedAmount) : Number(commissionCase.agencyCommissionAmount);
  const existingPaid = share
    ? await prisma.commissionPayment.aggregate({
        where: { commissionShareId: share.id, status: { in: [...PAID_STATUSES] } },
        _sum: { amount: true },
      })
    : await prisma.commissionPayment.aggregate({
        where: { commissionCaseId, commissionShareId: null, status: { in: [...PAID_STATUSES] } },
        _sum: { amount: true },
      });
  const alreadyPaid = Number(existingPaid._sum.amount ?? 0);
  const newContribution = (PAID_STATUSES as readonly string[]).includes(data.status) ? data.amount : 0;

  if (alreadyPaid + newContribution > due) {
    return {
      error: `Ce paiement porterait le total payé (${round2(alreadyPaid + newContribution)}) au-delà du montant dû (${due}). Reste dû : ${round2(due - alreadyPaid)}.`,
      fieldErrors: { amount: "Dépasse le montant dû." },
    };
  }

  await prisma.commissionPayment.create({
    data: {
      commissionCaseId,
      commissionShareId: share?.id,
      amount: data.amount,
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
      paidDate: data.paidDate ? new Date(data.paidDate) : undefined,
      status: data.status,
      internalReference: data.internalReference,
      paymentMethod: data.paymentMethod,
      internalNote: data.internalNote,
    },
  });

  await recomputeCommissionCaseStatus(commissionCaseId);
  if (share) await recomputeCommissionShareStatus(share.id);

  // Never log amount/reference/method/note — status only.
  await prisma.auditLog.create({
    data: {
      userId: gate.user.id,
      action: "COMMISSION_PAYMENT_CREATED",
      entity: "CommissionCase",
      entityId: commissionCaseId,
      metadata: { status: data.status, hasShare: Boolean(share) },
    },
  });

  revalidatePath(`/admin/commissions/${commissionCaseId}`);
  revalidatePath("/admin/commissions");
}

export async function updateCommissionPayment(
  paymentId: string,
  _prevState: CommissionPaymentFormState,
  formData: FormData
): Promise<CommissionPaymentFormState> {
  const gate = await assertCanManage();
  if (!gate.ok) return { error: gate.error };

  const payment = await prisma.commissionPayment.findUnique({ where: { id: paymentId }, include: { commissionCase: true } });
  if (!payment) return { error: "Paiement introuvable." };

  const parsed = parseCommissionPaymentForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  let share = null;
  if (data.commissionShareId) {
    share = await prisma.commissionShare.findUnique({ where: { id: data.commissionShareId } });
    if (!share || share.commissionCaseId !== payment.commissionCaseId) {
      return { error: "Part invalide pour ce dossier.", fieldErrors: { commissionShareId: "Part invalide pour ce dossier." } };
    }
  }

  const due = share ? Number(share.computedAmount) : Number(payment.commissionCase.agencyCommissionAmount);
  const existingPaid = share
    ? await prisma.commissionPayment.aggregate({
        where: { commissionShareId: share.id, status: { in: [...PAID_STATUSES] }, id: { not: paymentId } },
        _sum: { amount: true },
      })
    : await prisma.commissionPayment.aggregate({
        where: { commissionCaseId: payment.commissionCaseId, commissionShareId: null, status: { in: [...PAID_STATUSES] }, id: { not: paymentId } },
        _sum: { amount: true },
      });
  const alreadyPaid = Number(existingPaid._sum.amount ?? 0);
  const newContribution = (PAID_STATUSES as readonly string[]).includes(data.status) ? data.amount : 0;

  if (alreadyPaid + newContribution > due) {
    return {
      error: `Ce paiement porterait le total payé (${round2(alreadyPaid + newContribution)}) au-delà du montant dû (${due}). Reste dû : ${round2(due - alreadyPaid)}.`,
      fieldErrors: { amount: "Dépasse le montant dû." },
    };
  }

  const previousShareId = payment.commissionShareId;

  await prisma.commissionPayment.update({
    where: { id: paymentId },
    data: {
      commissionShareId: share?.id ?? null,
      amount: data.amount,
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
      paidDate: data.paidDate ? new Date(data.paidDate) : null,
      status: data.status,
      internalReference: data.internalReference ?? null,
      paymentMethod: data.paymentMethod ?? null,
      internalNote: data.internalNote ?? null,
    },
  });

  await recomputeCommissionCaseStatus(payment.commissionCaseId);
  if (share) await recomputeCommissionShareStatus(share.id);
  if (previousShareId && previousShareId !== share?.id) await recomputeCommissionShareStatus(previousShareId);

  await prisma.auditLog.create({
    data: {
      userId: gate.user.id,
      action: "COMMISSION_PAYMENT_UPDATED",
      entity: "CommissionCase",
      entityId: payment.commissionCaseId,
      metadata: { status: data.status, hasShare: Boolean(share) },
    },
  });

  revalidatePath(`/admin/commissions/${payment.commissionCaseId}`);
  revalidatePath("/admin/commissions");
}

/** A payment is never deleted — cancelling it sets status ANNULE, which the recompute helpers then treat as non-paid. */
export async function cancelCommissionPayment(paymentId: string): Promise<void> {
  const gate = await assertCanManage();
  if (!gate.ok) return;

  const payment = await prisma.commissionPayment.findUnique({ where: { id: paymentId } });
  if (!payment) return;

  await prisma.commissionPayment.update({ where: { id: paymentId }, data: { status: "ANNULE" } });

  await recomputeCommissionCaseStatus(payment.commissionCaseId);
  if (payment.commissionShareId) await recomputeCommissionShareStatus(payment.commissionShareId);

  await prisma.auditLog.create({
    data: { userId: gate.user.id, action: "COMMISSION_PAYMENT_CANCELLED", entity: "CommissionCase", entityId: payment.commissionCaseId, metadata: {} },
  });

  revalidatePath(`/admin/commissions/${payment.commissionCaseId}`);
  revalidatePath("/admin/commissions");
}
