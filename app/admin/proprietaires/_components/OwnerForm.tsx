"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import type { OwnerFormState } from "@/lib/real-estate-network/owner-actions";
import { partyKindOptions, contactPreferenceOptions } from "@/lib/real-estate-network/enum-labels";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";

export type OwnerFormDefaults = {
  kind?: "PHYSIQUE" | "SOCIETE";
  fullNameOrCompany?: string;
  cinOrIce?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  contactPreference?: string;
  internalNotes?: string;
};

type Props = {
  action: (prevState: OwnerFormState, formData: FormData) => Promise<OwnerFormState>;
  submitLabel: string;
  defaultValues?: OwnerFormDefaults;
};

export default function OwnerForm({ action, submitLabel, defaultValues }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" error={state?.fieldErrors?.kind}>
          <select name="kind" defaultValue={defaultValues?.kind ?? "PHYSIQUE"} className={inputClass}>
            {partyKindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nom / raison sociale" error={state?.fieldErrors?.fullNameOrCompany}>
          <input name="fullNameOrCompany" defaultValue={defaultValues?.fullNameOrCompany} required maxLength={200} className={inputClass} />
        </Field>
        <Field label="CIN / ICE" error={state?.fieldErrors?.cinOrIce}>
          <input name="cinOrIce" defaultValue={defaultValues?.cinOrIce} maxLength={50} className={inputClass} />
        </Field>
        <Field label="Téléphone" error={state?.fieldErrors?.phone}>
          <input name="phone" defaultValue={defaultValues?.phone} maxLength={30} className={inputClass} />
        </Field>
        <Field label="E-mail" error={state?.fieldErrors?.email}>
          <input type="email" name="email" defaultValue={defaultValues?.email} maxLength={200} className={inputClass} />
        </Field>
        <Field label="Préférence de contact" error={state?.fieldErrors?.contactPreference}>
          <select name="contactPreference" defaultValue={defaultValues?.contactPreference ?? ""} className={inputClass}>
            <option value="">Non précisée</option>
            {contactPreferenceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ville" error={state?.fieldErrors?.city}>
          <input name="city" defaultValue={defaultValues?.city} maxLength={120} className={inputClass} />
        </Field>
        <Field label="Adresse" error={state?.fieldErrors?.address}>
          <input name="address" defaultValue={defaultValues?.address} maxLength={240} className={inputClass} />
        </Field>
      </div>

      <Field label="Notes internes" error={state?.fieldErrors?.internalNotes}>
        <textarea name="internalNotes" defaultValue={defaultValues?.internalNotes} rows={4} maxLength={2000} className={inputClass} />
      </Field>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
