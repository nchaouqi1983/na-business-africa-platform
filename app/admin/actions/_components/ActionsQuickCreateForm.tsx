"use client";

import { useActionState, useState } from "react";
import Button from "@/components/Button";
import { createStandaloneActivity, type ActivityFormState } from "@/lib/crm/activity-actions";
import { activityTypeOptions } from "@/lib/crm/enum-labels";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";
import SearchPicker, { type SearchPickerOption } from "@/app/admin/_components/SearchPicker";

export default function ActionsQuickCreateForm({ prospects }: { prospects: SearchPickerOption[] }) {
  const [state, formAction, pending] = useActionState<ActivityFormState, FormData>(createStandaloneActivity, undefined);
  const [prospectId, setProspectId] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
          {state.error}
        </p>
      )}
      <Field label="Prospect" error={state?.fieldErrors?.prospectId}>
        <SearchPicker
          name="prospectId"
          options={prospects}
          value={prospectId}
          onChange={setProspectId}
          placeholder="Rechercher un prospect…"
          emptyLabel="Aucun prospect trouvé."
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Type" error={state?.fieldErrors?.type}>
          <select name="type" defaultValue="TACHE" className={inputClass}>
            {activityTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Titre" error={state?.fieldErrors?.title}>
          <input type="text" name="title" required maxLength={200} className={inputClass} />
        </Field>
        <Field label="Échéance" error={state?.fieldErrors?.dueAt}>
          <input type="datetime-local" name="dueAt" className={inputClass} />
        </Field>
      </div>
      <Button
        type="submit"
        disabled={pending || !prospectId}
        title={!prospectId ? "Sélectionnez un prospect avant d'ajouter l'action." : undefined}
        size="sm"
        className="w-fit"
      >
        {pending ? "Ajout…" : "Ajouter l'action"}
      </Button>
    </form>
  );
}
