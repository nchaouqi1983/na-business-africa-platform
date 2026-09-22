"use client";

import { useActionState, useEffect, useRef } from "react";
import Button from "@/components/Button";
import type { PromoterFormState } from "@/lib/real-estate-network/promoter-actions";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";

export type PromoterFormDefaults = {
  companyName?: string;
  mainContactName?: string;
  phone?: string;
  email?: string;
  website?: string;
  ice?: string;
  address?: string;
  city?: string;
  internalNotes?: string;
};

type Props = {
  action: (prevState: PromoterFormState, formData: FormData) => Promise<PromoterFormState>;
  submitLabel: string;
  defaultValues?: PromoterFormDefaults;
  /** Only relevant for a non-redirecting (quick-create) action — fired once with the created promoter. */
  onCreated?: (promoter: { id: string; companyName: string }) => void;
};

export default function PromoterForm({ action, submitLabel, defaultValues, onCreated }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const notifiedFor = useRef<string | null>(null);

  useEffect(() => {
    if (state?.promoter && onCreated && notifiedFor.current !== state.promoter.id) {
      notifiedFor.current = state.promoter.id;
      onCreated(state.promoter);
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
        <Field label="Raison sociale" error={state?.fieldErrors?.companyName}>
          <input name="companyName" defaultValue={defaultValues?.companyName} required maxLength={200} className={inputClass} />
        </Field>
        <Field label="Contact principal" error={state?.fieldErrors?.mainContactName}>
          <input name="mainContactName" defaultValue={defaultValues?.mainContactName} maxLength={120} className={inputClass} />
        </Field>
        <Field label="Téléphone" error={state?.fieldErrors?.phone}>
          <input name="phone" defaultValue={defaultValues?.phone} maxLength={30} className={inputClass} />
        </Field>
        <Field label="E-mail" error={state?.fieldErrors?.email}>
          <input type="email" name="email" defaultValue={defaultValues?.email} maxLength={200} className={inputClass} />
        </Field>
        <Field label="Site web" error={state?.fieldErrors?.website}>
          <input name="website" defaultValue={defaultValues?.website} maxLength={300} className={inputClass} />
        </Field>
        <Field label="ICE" error={state?.fieldErrors?.ice}>
          <input name="ice" defaultValue={defaultValues?.ice} maxLength={50} className={inputClass} />
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
