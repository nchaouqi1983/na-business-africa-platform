"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import type { MandateFormState } from "@/lib/finance/mandate-actions";
import { mandateTypeOptions, mandateStatusOptions } from "@/lib/finance/enum-labels";
import { Field, CheckboxField, inputClass } from "@/app/admin/biens/_components/FormField";

export type MandateFormDefaults = {
  ownerId?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  isExclusive?: boolean;
  displayedPrice?: number;
  agreedNetSellerPrice?: number;
  internalConditions?: string;
  documentId?: string;
};

type PickerOption = { id: string; label: string };

type Props = {
  action: (prevState: MandateFormState, formData: FormData) => Promise<MandateFormState>;
  submitLabel: string;
  defaultValues?: MandateFormDefaults;
  pickerOwners: PickerOption[];
  /** Only present on the standalone "nouveau mandat" page — absent when the property is already fixed (edit screen). */
  pickerProperties?: PickerOption[];
  /** Only present on the edit screen, scoped to the mandate's own bien. */
  pickerDocuments?: PickerOption[];
};

export default function MandateForm({ action, submitLabel, defaultValues, pickerOwners, pickerProperties, pickerDocuments }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {pickerProperties && (
          <Field label="Bien" error={state?.fieldErrors?.propertyId} htmlFor="propertyId">
            <select id="propertyId" name="propertyId" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Sélectionner un bien
              </option>
              {pickerProperties.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Type de mandat" error={state?.fieldErrors?.type}>
          <select name="type" defaultValue={defaultValues?.type ?? "SIMPLE"} className={inputClass}>
            {mandateTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Statut" error={state?.fieldErrors?.status}>
          <select name="status" defaultValue={defaultValues?.status ?? "BROUILLON"} className={inputClass}>
            {mandateStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Propriétaire" error={state?.fieldErrors?.ownerId}>
          <select name="ownerId" defaultValue={defaultValues?.ownerId ?? ""} className={inputClass}>
            <option value="">Non précisé</option>
            {pickerOwners.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Date de début" error={state?.fieldErrors?.startDate}>
          <input type="date" name="startDate" defaultValue={defaultValues?.startDate} className={inputClass} />
        </Field>

        <Field label="Date de fin" error={state?.fieldErrors?.endDate}>
          <input type="date" name="endDate" defaultValue={defaultValues?.endDate} className={inputClass} />
        </Field>

        <Field label="Prix affiché (MAD)" error={state?.fieldErrors?.displayedPrice}>
          <input type="number" name="displayedPrice" min="0" step="0.01" defaultValue={defaultValues?.displayedPrice} className={inputClass} />
        </Field>

        <Field label="Prix net vendeur convenu (MAD)" error={state?.fieldErrors?.agreedNetSellerPrice}>
          <input
            type="number"
            name="agreedNetSellerPrice"
            min="0"
            step="0.01"
            defaultValue={defaultValues?.agreedNetSellerPrice}
            className={inputClass}
          />
        </Field>

        {pickerDocuments && (
          <Field label="Document du mandat" error={state?.fieldErrors?.documentId}>
            <select name="documentId" defaultValue={defaultValues?.documentId ?? ""} className={inputClass}>
              <option value="">Aucun</option>
              {pickerDocuments.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <CheckboxField label="Mandat exclusif" name="isExclusive" defaultChecked={defaultValues?.isExclusive} />

      <Field label="Conditions internes" error={state?.fieldErrors?.internalConditions}>
        <textarea name="internalConditions" defaultValue={defaultValues?.internalConditions} rows={4} maxLength={4000} className={inputClass} />
      </Field>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
