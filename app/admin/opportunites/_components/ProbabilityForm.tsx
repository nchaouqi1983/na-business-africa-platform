"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import type { OpportunityFormState } from "@/lib/crm/opportunity-actions";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";

/** SUPER_ADMIN/ADMIN only — rendered by the detail page only for those roles, and re-checked by the action. */
export default function ProbabilityForm({
  action,
  probability,
  stageDefault,
  isManual,
}: {
  action: (prevState: OpportunityFormState, formData: FormData) => Promise<OpportunityFormState>;
  probability: number;
  stageDefault: number;
  isManual: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
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
      <Field label={`Probabilité (%) — défaut du stade : ${stageDefault} %`} error={state?.fieldErrors?.probability}>
        <input type="number" name="probability" min="0" max="100" step="1" defaultValue={probability} className={inputClass} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          Ajuster
        </Button>
        {isManual && (
          <Button type="submit" name="reset" value="1" variant="ghost" size="sm" disabled={pending} className="border border-anthracite-200 hover:border-gold-500">
            Rétablir le défaut
          </Button>
        )}
      </div>
    </form>
  );
}
