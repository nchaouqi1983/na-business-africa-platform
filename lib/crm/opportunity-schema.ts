import * as z from "zod";
import {
  opportunityStageValues,
  opportunityLossReasonValues,
  opportunityTransactionValues,
  openOpportunityStages,
} from "@/lib/crm/opportunity-rules";
import { optionalString, optionalPositiveNumber, emptyToUndefined } from "@/lib/admin/zod-helpers";

/** <input type="date"> value, e.g. "2026-10-31". */
const optionalDate = z.preprocess(
  emptyToUndefined,
  z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Date invalide." }).optional()
);

const optionalId = z.preprocess(emptyToUndefined, z.string().trim().optional());

/** Create + edit form. The stage itself only moves through opportunityStageChangeSchema once the opportunity exists. */
export const opportunityFormSchema = z.object({
  propertyId: optionalId,
  transaction: z.enum(opportunityTransactionValues, { error: "Transaction invalide." }),
  title: z.string().trim().min(1, { error: "Libellé requis." }).max(200),
  estimatedAmount: optionalPositiveNumber,
  currency: optionalString(10),
  expectedCloseDate: optionalDate,
  assignedToId: optionalId,
  internalNote: optionalString(4000),
});

export type OpportunityFormInput = z.infer<typeof opportunityFormSchema>;

export function parseOpportunityForm(formData: FormData) {
  return opportunityFormSchema.safeParse({
    propertyId: formData.get("propertyId"),
    transaction: formData.get("transaction"),
    title: formData.get("title"),
    estimatedAmount: formData.get("estimatedAmount"),
    currency: formData.get("currency"),
    expectedCloseDate: formData.get("expectedCloseDate"),
    assignedToId: formData.get("assignedToId"),
    internalNote: formData.get("internalNote"),
  });
}

/** Initial stage on creation — never GAGNEE/PERDUE directly. */
export const initialStageSchema = z.preprocess(
  (value) => emptyToUndefined(value) ?? "NOUVELLE",
  z.enum(openOpportunityStages as [string, ...string[]], { error: "Stade initial invalide." })
);

export const opportunityStageChangeSchema = z
  .object({
    stage: z.enum(opportunityStageValues, { error: "Stade invalide." }),
    finalAmount: optionalPositiveNumber,
    closedAt: optionalDate,
    lossReason: z.preprocess(emptyToUndefined, z.enum(opportunityLossReasonValues, { error: "Motif de perte invalide." }).optional()),
    lossNote: optionalString(2000),
  })
  .superRefine((data, ctx) => {
    if (data.stage === "GAGNEE") {
      if (data.finalAmount === undefined) ctx.addIssue({ code: "custom", message: "Montant final requis pour une opportunité gagnée.", path: ["finalAmount"] });
      if (!data.closedAt) ctx.addIssue({ code: "custom", message: "Date de clôture requise pour une opportunité gagnée.", path: ["closedAt"] });
    }
    if (data.stage === "PERDUE" && !data.lossReason) {
      ctx.addIssue({ code: "custom", message: "Motif de perte obligatoire.", path: ["lossReason"] });
    }
  });

export type OpportunityStageChangeInput = z.infer<typeof opportunityStageChangeSchema>;

export function parseOpportunityStageChange(formData: FormData) {
  return opportunityStageChangeSchema.safeParse({
    stage: formData.get("stage"),
    finalAmount: formData.get("finalAmount"),
    closedAt: formData.get("closedAt"),
    lossReason: formData.get("lossReason"),
    lossNote: formData.get("lossNote"),
  });
}

export const probabilityOverrideSchema = z.object({
  probability: z.coerce
    .number({ error: "Probabilité invalide." })
    .int({ error: "Doit être un nombre entier." })
    .min(0, { error: "Doit être entre 0 et 100." })
    .max(100, { error: "Doit être entre 0 et 100." }),
});
