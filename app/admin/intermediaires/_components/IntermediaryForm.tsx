"use client";

import { useActionState, useEffect, useRef } from "react";
import Button from "@/components/Button";
import type { IntermediaryFormState } from "@/lib/real-estate-network/intermediary-actions";
import { partyKindOptions, intermediaryTypeOptions } from "@/lib/real-estate-network/enum-labels";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";

export type IntermediaryFormDefaults = {
  kind?: "PHYSIQUE" | "SOCIETE";
  nameOrCompany?: string;
  phone?: string;
  email?: string;
  type?: string;
  city?: string;
  internalNotes?: string;
};

type Props = {
  action: (prevState: IntermediaryFormState, formData: FormData) => Promise<IntermediaryFormState>;
  submitLabel: string;
  defaultValues?: IntermediaryFormDefaults;
  onCreated?: (intermediary: { id: string; nameOrCompany: string }) => void;
};

export default function IntermediaryForm({ action, submitLabel, defaultValues, onCreated }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const notifiedFor = useRef<string | null>(null);

  useEffect(() => {
    if (state?.intermediary && onCreated && notifiedFor.current !== state.intermediary.id) {
      notifiedFor.current = state.intermediary.id;
      onCreated(state.intermediary);
    }
  }, [state, onCreated]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type de personne" error={state?.fieldErrors?.kind}>
          <select name="kind" defaultValue={defaultValues?.kind ?? "PHYSIQUE"} className={inputClass}>
            {partyKindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nom / raison sociale" error={state?.fieldErrors?.nameOrCompany}>
          <input name="nameOrCompany" defaultValue={defaultValues?.nameOrCompany} required maxLength={200} className={inputClass} />
        </Field>
        <Field label="Type d'intermédiaire" error={state?.fieldErrors?.type}>
          <select name="type" defaultValue={defaultValues?.type ?? "AUTRE"} className={inputClass}>
            {intermediaryTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ville" error={state?.fieldErrors?.city}>
          <input name="city" defaultValue={defaultValues?.city} maxLength={120} className={inputClass} />
        </Field>
        <Field label="Téléphone" error={state?.fieldErrors?.phone}>
          <input name="phone" defaultValue={defaultValues?.phone} maxLength={30} className={inputClass} />
        </Field>
        <Field label="E-mail" error={state?.fieldErrors?.email}>
          <input type="email" name="email" defaultValue={defaultValues?.email} maxLength={200} className={inputClass} />
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
