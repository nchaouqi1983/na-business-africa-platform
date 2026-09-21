"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import type { PropertyFormState } from "@/lib/admin/property-actions";
import { Field, inputClass } from "./FormField";

export type PropertyPrivateDefaults = {
  privateAddress?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  mandateReference?: string;
  mandateStartDate?: string;
  mandateEndDate?: string;
  minimumNetPrice?: number;
  internalNotes?: string;
  source?: string;
};

type PropertyPrivateFormProps = {
  action: (prevState: PropertyFormState, formData: FormData) => Promise<PropertyFormState>;
  defaultValues?: PropertyPrivateDefaults;
};

export default function PropertyPrivateForm({ action, defaultValues }: PropertyPrivateFormProps) {
  const [state, formAction, pending] = useActionState<PropertyFormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <p className="rounded-xl bg-anthracite-50 px-4 py-3 text-xs text-anthracite-600">
        Réservé SUPER_ADMIN / ADMIN. Ces informations ne sont jamais transmises au site public ni aux rôles AGENT,
        EDITOR ou VIEWER.
      </p>

      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Adresse privée" error={state?.fieldErrors?.privateAddress}>
          <input name="privateAddress" defaultValue={defaultValues?.privateAddress} className={inputClass} />
        </Field>
        <Field label="Source du bien" error={state?.fieldErrors?.source}>
          <input name="source" defaultValue={defaultValues?.source} className={inputClass} />
        </Field>
        <Field label="Nom du propriétaire" error={state?.fieldErrors?.ownerName}>
          <input name="ownerName" defaultValue={defaultValues?.ownerName} className={inputClass} />
        </Field>
        <Field label="Téléphone du propriétaire" error={state?.fieldErrors?.ownerPhone}>
          <input name="ownerPhone" defaultValue={defaultValues?.ownerPhone} className={inputClass} />
        </Field>
        <Field label="E-mail du propriétaire" error={state?.fieldErrors?.ownerEmail}>
          <input name="ownerEmail" type="email" defaultValue={defaultValues?.ownerEmail} className={inputClass} />
        </Field>
        <Field label="Référence du mandat" error={state?.fieldErrors?.mandateReference}>
          <input name="mandateReference" defaultValue={defaultValues?.mandateReference} className={inputClass} />
        </Field>
        <Field label="Début du mandat" error={state?.fieldErrors?.mandateStartDate}>
          <input name="mandateStartDate" type="date" defaultValue={defaultValues?.mandateStartDate} className={inputClass} />
        </Field>
        <Field label="Fin du mandat" error={state?.fieldErrors?.mandateEndDate}>
          <input name="mandateEndDate" type="date" defaultValue={defaultValues?.mandateEndDate} className={inputClass} />
        </Field>
        <Field label="Prix net vendeur / plancher (MAD)" error={state?.fieldErrors?.minimumNetPrice}>
          <input
            name="minimumNetPrice"
            type="number"
            min="0"
            step="1"
            defaultValue={defaultValues?.minimumNetPrice}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Notes internes" error={state?.fieldErrors?.internalNotes}>
        <textarea name="internalNotes" rows={4} defaultValue={defaultValues?.internalNotes} className={inputClass} />
      </Field>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enregistrement…" : "Enregistrer les données privées"}
      </Button>
    </form>
  );
}
