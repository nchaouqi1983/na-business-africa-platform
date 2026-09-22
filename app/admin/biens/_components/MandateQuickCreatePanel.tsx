"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createMandateQuick, type MandateFormState } from "@/lib/finance/mandate-actions";
import { mandateTypeOptions } from "@/lib/finance/enum-labels";
import { Field, inputClass } from "./FormField";

type OwnerOption = { id: string; label: string };

type Props = {
  propertyId: string;
  pickerOwners: OwnerOption[];
};

export default function MandateQuickCreatePanel({ propertyId, pickerOwners }: Props) {
  const router = useRouter();
  const boundCreate = createMandateQuick.bind(null, propertyId);
  const [state, formAction, pending] = useActionState<MandateFormState, FormData>(boundCreate, undefined);
  const notifiedFor = useRef<string | null>(null);

  useEffect(() => {
    if (state?.mandate && notifiedFor.current !== state.mandate.id) {
      notifiedFor.current = state.mandate.id;
      router.refresh();
    }
  }, [state, router]);

  return (
    <details className="rounded-2xl border border-dashed border-anthracite-200 p-4">
      <summary className="cursor-pointer text-sm font-medium text-anthracite-700">+ Créer rapidement un mandat</summary>
      <form action={formAction} className="mt-3 flex flex-col gap-3">
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Type de mandat" error={state?.fieldErrors?.type}>
            <select name="type" defaultValue="SIMPLE" className={inputClass}>
              {mandateTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Propriétaire" error={state?.fieldErrors?.ownerId}>
            <select name="ownerId" defaultValue="" className={inputClass}>
              <option value="">Non précisé</option>
              {pickerOwners.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-full bg-anthracite-950 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-anthracite-800 disabled:cursor-not-allowed disabled:bg-anthracite-300"
        >
          {pending ? "Création…" : "Créer le mandat (brouillon)"}
        </button>
        {state?.mandate && <p className="text-xs text-gold-700">Mandat {state.mandate.reference} créé.</p>}
      </form>
    </details>
  );
}
