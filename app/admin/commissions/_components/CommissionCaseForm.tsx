"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import type { CommissionCaseFormState } from "@/lib/finance/commission-actions";
import {
  commissionTransactionTypeOptions,
  commissionCaseStatusOptions,
  commissionBasisOptions,
  commissionBilledToOptions,
} from "@/lib/finance/enum-labels";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";

export type CommissionCaseFormDefaults = {
  mandateId?: string;
  transaction?: string;
  status?: string;
  basis?: string;
  baseAmount?: number;
  agencyCommissionRate?: number;
  agencyCommissionAmountInput?: number;
  billedTo?: string;
  currency?: string;
  finalTransactionAmount?: number;
  expectedCollectionDate?: string;
  internalNotes?: string;
};

type PickerOption = { id: string; label: string };

type Props = {
  action: (prevState: CommissionCaseFormState, formData: FormData) => Promise<CommissionCaseFormState>;
  submitLabel: string;
  defaultValues?: CommissionCaseFormDefaults;
  pickerMandates: PickerOption[];
  /** Phase 6L: explicit link to the opportunity this dossier settles (re-validated server-side). */
  opportunityId?: string;
};

export default function CommissionCaseForm({ action, submitLabel, defaultValues, pickerMandates, opportunityId }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {opportunityId && <input type="hidden" name="opportunityId" value={opportunityId} />}
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mandat lié" error={state?.fieldErrors?.mandateId}>
          <select name="mandateId" defaultValue={defaultValues?.mandateId ?? ""} className={inputClass}>
            <option value="">Aucun</option>
            {pickerMandates.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Transaction" error={state?.fieldErrors?.transaction}>
          <select name="transaction" defaultValue={defaultValues?.transaction ?? "VENTE"} className={inputClass}>
            {commissionTransactionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Statut" error={state?.fieldErrors?.status}>
          <select name="status" defaultValue={defaultValues?.status ?? "PREVISION"} className={inputClass}>
            {commissionCaseStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Base de calcul" error={state?.fieldErrors?.basis}>
          <select name="basis" defaultValue={defaultValues?.basis ?? "PRIX_FINAL"} className={inputClass}>
            {commissionBasisOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Montant base (MAD)" error={state?.fieldErrors?.baseAmount}>
          <input type="number" name="baseAmount" min="0" step="0.01" required defaultValue={defaultValues?.baseAmount} className={inputClass} />
        </Field>

        <Field label="Taux commission agence (%)" error={state?.fieldErrors?.agencyCommissionRate}>
          <input
            type="number"
            name="agencyCommissionRate"
            min="0"
            max="100"
            step="0.01"
            defaultValue={defaultValues?.agencyCommissionRate}
            className={inputClass}
          />
        </Field>

        <Field label="Montant commission agence (si pas de taux)" error={state?.fieldErrors?.agencyCommissionAmountInput}>
          <input
            type="number"
            name="agencyCommissionAmountInput"
            min="0"
            step="0.01"
            defaultValue={defaultValues?.agencyCommissionAmountInput}
            className={inputClass}
          />
        </Field>

        <Field label="Commission facturée à" error={state?.fieldErrors?.billedTo}>
          <select name="billedTo" defaultValue={defaultValues?.billedTo ?? ""} className={inputClass}>
            <option value="">Non précisé</option>
            {commissionBilledToOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Devise" error={state?.fieldErrors?.currency}>
          <input name="currency" defaultValue={defaultValues?.currency ?? "MAD"} maxLength={10} className={inputClass} />
        </Field>

        <Field label="Prix final de transaction (MAD)" error={state?.fieldErrors?.finalTransactionAmount}>
          <input
            type="number"
            name="finalTransactionAmount"
            min="0"
            step="0.01"
            defaultValue={defaultValues?.finalTransactionAmount}
            className={inputClass}
          />
        </Field>

        <Field label="Date prévue d'encaissement" error={state?.fieldErrors?.expectedCollectionDate}>
          <input type="date" name="expectedCollectionDate" defaultValue={defaultValues?.expectedCollectionDate} className={inputClass} />
        </Field>
      </div>

      <Field label="Notes internes" error={state?.fieldErrors?.internalNotes}>
        <textarea name="internalNotes" defaultValue={defaultValues?.internalNotes} rows={4} maxLength={4000} className={inputClass} />
      </Field>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
