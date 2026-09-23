"use client";

import { useActionState, useState } from "react";
import Button from "@/components/Button";
import type { OpportunityFormState } from "@/lib/crm/opportunity-actions";
import {
  opportunityStageValues,
  opportunityStageLabels,
  opportunityLossReasonOptions,
  defaultStageProbability,
  stageRequiresProperty,
  type OpportunityStageValue,
} from "@/lib/crm/opportunity-rules";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Detail-page stage change — the same Server Action as the Kanban board, with the GAGNEE/PERDUE extra fields inline. */
export default function StageChangeForm({
  action,
  currentStage,
  hasProperty,
  estimatedAmount,
}: {
  action: (prevState: OpportunityFormState, formData: FormData) => Promise<OpportunityFormState>;
  currentStage: OpportunityStageValue;
  hasProperty: boolean;
  estimatedAmount: number | null;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [stage, setStage] = useState<OpportunityStageValue>(currentStage);
  const missingProperty = stageRequiresProperty(stage) && !hasProperty;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          {state.success}
        </p>
      )}

      <Field label="Nouveau stade" error={state?.fieldErrors?.stage}>
        <select name="stage" value={stage} onChange={(event) => setStage(event.target.value as OpportunityStageValue)} className={inputClass}>
          {opportunityStageValues.map((value) => (
            <option key={value} value={value}>
              {opportunityStageLabels[value]} ({defaultStageProbability[value]} %)
            </option>
          ))}
        </select>
      </Field>
      {missingProperty && <p className="text-xs text-red-600">Un bien doit être rattaché avant de passer à ce stade.</p>}

      {stage === "GAGNEE" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Montant final du deal" error={state?.fieldErrors?.finalAmount}>
            <input type="number" name="finalAmount" min="0" step="0.01" required defaultValue={estimatedAmount ?? undefined} className={inputClass} />
          </Field>
          <Field label="Date de clôture" error={state?.fieldErrors?.closedAt}>
            <input type="date" name="closedAt" required defaultValue={todayIso()} className={inputClass} />
          </Field>
        </div>
      )}

      {stage === "PERDUE" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Motif de perte" error={state?.fieldErrors?.lossReason}>
            <select name="lossReason" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Choisir un motif…
              </option>
              {opportunityLossReasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Précision (optionnel)" error={state?.fieldErrors?.lossNote}>
            <textarea name="lossNote" rows={2} maxLength={2000} className={inputClass} />
          </Field>
        </div>
      )}

      <Button type="submit" size="sm" disabled={pending || stage === currentStage || missingProperty} className="w-fit">
        {pending ? "Validation…" : "Changer de stade"}
      </Button>
    </form>
  );
}
