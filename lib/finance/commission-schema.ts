import * as z from "zod";
import {
  commissionTransactionTypeValues,
  commissionCaseStatusValues,
  commissionBasisValues,
  commissionBilledToValues,
  commissionBeneficiaryTypeValues,
  commissionShareModeValues,
  commissionShareStatusValues,
  commissionPaymentStatusValues,
} from "@/lib/finance/enum-labels";
import { optionalString, optionalPositiveNumber, optionalPercent, emptyToUndefined } from "@/lib/admin/zod-helpers";

const positiveAmount = z.coerce.number({ error: "Montant invalide." }).positive({ error: "Doit être supérieur à 0." });

export const commissionCaseFormSchema = z.object({
  mandateId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  transaction: z.enum(commissionTransactionTypeValues, { error: "Transaction invalide." }),
  status: z.enum(commissionCaseStatusValues, { error: "Statut invalide." }).default("PREVISION"),
  basis: z.enum(commissionBasisValues, { error: "Base de calcul invalide." }),
  baseAmount: positiveAmount,
  agencyCommissionRate: optionalPercent,
  /** Manual override — required only when agencyCommissionRate is left empty (see refine below). */
  agencyCommissionAmountInput: optionalPositiveNumber,
  billedTo: z.preprocess(emptyToUndefined, z.enum(commissionBilledToValues).optional()),
  currency: optionalString(10),
  finalTransactionAmount: optionalPositiveNumber,
  expectedCollectionDate: optionalString(10),
  internalNotes: optionalString(4000),
}).refine((data) => data.agencyCommissionRate !== undefined || data.agencyCommissionAmountInput !== undefined, {
  message: "Indiquez un taux ou un montant de commission agence.",
  path: ["agencyCommissionAmountInput"],
});

export type CommissionCaseFormInput = z.infer<typeof commissionCaseFormSchema>;

export function parseCommissionCaseForm(formData: FormData) {
  return commissionCaseFormSchema.safeParse({
    mandateId: formData.get("mandateId"),
    transaction: formData.get("transaction"),
    status: formData.get("status"),
    basis: formData.get("basis"),
    baseAmount: formData.get("baseAmount"),
    agencyCommissionRate: formData.get("agencyCommissionRate"),
    agencyCommissionAmountInput: formData.get("agencyCommissionAmountInput"),
    billedTo: formData.get("billedTo"),
    currency: formData.get("currency"),
    finalTransactionAmount: formData.get("finalTransactionAmount"),
    expectedCollectionDate: formData.get("expectedCollectionDate"),
    internalNotes: formData.get("internalNotes"),
  });
}

export const commissionShareFormSchema = z
  .object({
    beneficiaryType: z.enum(commissionBeneficiaryTypeValues, { error: "Bénéficiaire invalide." }),
    intermediaryId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
    userId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
    freeBeneficiaryName: optionalString(200),
    mode: z.enum(commissionShareModeValues, { error: "Mode invalide." }),
    value: positiveAmount,
    status: z.enum(commissionShareStatusValues, { error: "Statut invalide." }).default("PREVU"),
    notes: optionalString(2000),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "POURCENTAGE" && data.value > 100) {
      ctx.addIssue({ code: "custom", message: "Un pourcentage ne peut pas dépasser 100.", path: ["value"] });
    }
    if (data.beneficiaryType === "INTERMEDIAIRE" && !data.intermediaryId) {
      ctx.addIssue({ code: "custom", message: "Intermédiaire requis.", path: ["intermediaryId"] });
    }
    if (data.beneficiaryType === "AGENT_INTERNE" && !data.userId) {
      ctx.addIssue({ code: "custom", message: "Agent interne requis.", path: ["userId"] });
    }
    if (data.beneficiaryType === "AUTRE" && !data.freeBeneficiaryName) {
      ctx.addIssue({ code: "custom", message: "Nom du bénéficiaire requis.", path: ["freeBeneficiaryName"] });
    }
  });

export type CommissionShareFormInput = z.infer<typeof commissionShareFormSchema>;

export function parseCommissionShareForm(formData: FormData) {
  return commissionShareFormSchema.safeParse({
    beneficiaryType: formData.get("beneficiaryType"),
    intermediaryId: formData.get("intermediaryId"),
    userId: formData.get("userId"),
    freeBeneficiaryName: formData.get("freeBeneficiaryName"),
    mode: formData.get("mode"),
    value: formData.get("value"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
}

export const commissionPaymentFormSchema = z.object({
  commissionShareId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  amount: positiveAmount,
  expectedDate: optionalString(10),
  paidDate: optionalString(10),
  status: z.enum(commissionPaymentStatusValues, { error: "Statut invalide." }).default("PREVU"),
  internalReference: optionalString(120),
  paymentMethod: optionalString(120),
  internalNote: optionalString(2000),
});

export type CommissionPaymentFormInput = z.infer<typeof commissionPaymentFormSchema>;

export function parseCommissionPaymentForm(formData: FormData) {
  return commissionPaymentFormSchema.safeParse({
    commissionShareId: formData.get("commissionShareId"),
    amount: formData.get("amount"),
    expectedDate: formData.get("expectedDate"),
    paidDate: formData.get("paidDate"),
    status: formData.get("status"),
    internalReference: formData.get("internalReference"),
    paymentMethod: formData.get("paymentMethod"),
    internalNote: formData.get("internalNote"),
  });
}
