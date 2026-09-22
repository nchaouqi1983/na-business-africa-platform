"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import type { ActivityFormState } from "@/lib/crm/activity-actions";
import { activityTypeOptions } from "@/lib/crm/enum-labels";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";

/** Quick add-a-relance/task form, reused on the prospect 360°, the visit detail, and /admin/actions. */
export default function QuickActivityForm({
  action,
  defaultType = "RELANCE",
}: {
  action: (prevState: ActivityFormState, formData: FormData) => Promise<ActivityFormState>;
  defaultType?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-anthracite-100 bg-anthracite-50 p-4">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
          {state.error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Type" error={state?.fieldErrors?.type}>
          <select name="type" defaultValue={defaultType} className={inputClass}>
            {activityTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Titre" error={state?.fieldErrors?.title}>
          <input type="text" name="title" required maxLength={200} placeholder="Ex. Relancer sur le budget" className={inputClass} />
        </Field>
        <Field label="Échéance" error={state?.fieldErrors?.dueAt}>
          <input type="datetime-local" name="dueAt" className={inputClass} />
        </Field>
      </div>
      <Field label="Note (optionnel)" error={state?.fieldErrors?.content}>
        <textarea name="content" rows={2} maxLength={2000} className={inputClass} />
      </Field>
      <Button type="submit" disabled={pending} size="sm" className="w-fit">
        {pending ? "Ajout…" : "Ajouter l'action"}
      </Button>
    </form>
  );
}
