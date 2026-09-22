"use client";

import { useActionState, useState } from "react";
import Button from "@/components/Button";
import type { PropertyInterestFormState } from "@/lib/crm/prospect-actions";
import { interestLevelOptions } from "@/lib/crm/enum-labels";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";
import SearchPicker, { type SearchPickerOption } from "@/app/admin/_components/SearchPicker";

export default function PropertyInterestForm({
  action,
  properties,
}: {
  action: (prevState: PropertyInterestFormState, formData: FormData) => Promise<PropertyInterestFormState>;
  properties: SearchPickerOption[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [propertyId, setPropertyId] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-anthracite-100 bg-anthracite-50 p-4">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
          {state.error}
        </p>
      )}
      <Field label="Bien" error={state?.fieldErrors?.propertyId}>
        <SearchPicker
          name="propertyId"
          options={properties}
          value={propertyId}
          onChange={setPropertyId}
          placeholder="Rechercher un bien…"
          emptyLabel="Aucun bien trouvé."
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Niveau d'intérêt" error={state?.fieldErrors?.interestLevel}>
          <select name="interestLevel" defaultValue="A_SUIVRE" className={inputClass}>
            {interestLevelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Note (optionnel)" error={state?.fieldErrors?.internalNote}>
          <input type="text" name="internalNote" maxLength={1000} className={inputClass} />
        </Field>
      </div>
      <Button type="submit" disabled={pending || !propertyId} size="sm" className="w-fit">
        {pending ? "Ajout…" : "Ajouter le bien d'intérêt"}
      </Button>
    </form>
  );
}
