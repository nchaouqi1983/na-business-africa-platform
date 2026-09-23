"use client";

import { useActionState, useState } from "react";
import Button from "@/components/Button";
import type { OpportunityFormState } from "@/lib/crm/opportunity-actions";
import { opportunityTransactionOptions, opportunityStageLabels, openOpportunityStages, defaultStageProbability } from "@/lib/crm/opportunity-rules";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";
import SearchPicker, { type SearchPickerOption } from "@/app/admin/_components/SearchPicker";

export type OpportunityFormDefaults = {
  propertyId?: string;
  transaction?: string;
  title?: string;
  estimatedAmount?: number;
  expectedCloseDate?: string;
  assignedToId?: string;
  internalNote?: string;
  stage?: string;
};

type Props = {
  action: (prevState: OpportunityFormState, formData: FormData) => Promise<OpportunityFormState>;
  submitLabel: string;
  defaultValues?: OpportunityFormDefaults;
  assignableUsers: SearchPickerOption[];
  pickerProperties: SearchPickerOption[];
  /** Creation only: prospect picker, or a fixed prospect when arriving from a prospect/visit. */
  pickerProspects?: SearchPickerOption[];
  initialProspectId?: string;
  fixedProspect?: { id: string; label: string };
  /** Creation only: source visit (hidden) and initial stage selector. */
  visitId?: string;
  showInitialStage?: boolean;
};

export default function OpportunityForm({
  action,
  submitLabel,
  defaultValues,
  assignableUsers,
  pickerProperties,
  pickerProspects,
  initialProspectId = "",
  fixedProspect,
  visitId,
  showInitialStage = false,
}: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [prospectId, setProspectId] = useState(initialProspectId);
  const [propertyId, setPropertyId] = useState(defaultValues?.propertyId ?? "");
  const [assignedToId, setAssignedToId] = useState(defaultValues?.assignedToId ?? "");

  const propertyOptions: SearchPickerOption[] = [{ id: "", label: "Aucun bien pour l'instant", sublabel: "Obligatoire à partir du stade Visite" }, ...pickerProperties];

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          {state.success}
        </p>
      )}

      {visitId && <input type="hidden" name="visitId" value={visitId} />}

      {fixedProspect && (
        <Field label="Prospect">
          <input type="hidden" name="prospectId" value={fixedProspect.id} />
          <p className={inputClass + " bg-anthracite-50"}>{fixedProspect.label}</p>
        </Field>
      )}
      {pickerProspects && !fixedProspect && (
        <Field label="Prospect" error={state?.fieldErrors?.prospectId}>
          <SearchPicker
            name="prospectId"
            options={pickerProspects}
            value={prospectId}
            onChange={setProspectId}
            placeholder="Rechercher un prospect…"
            emptyLabel="Aucun prospect trouvé."
          />
        </Field>
      )}

      <Field label="Bien" error={state?.fieldErrors?.propertyId}>
        <SearchPicker
          name="propertyId"
          options={propertyOptions}
          value={propertyId}
          onChange={setPropertyId}
          placeholder="Rechercher un bien…"
          emptyLabel="Aucun bien trouvé."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Libellé" error={state?.fieldErrors?.title}>
          <input type="text" name="title" required maxLength={200} defaultValue={defaultValues?.title} placeholder="Ex. Achat villa Anfa" className={inputClass} />
        </Field>
        <Field label="Transaction" error={state?.fieldErrors?.transaction}>
          <select name="transaction" defaultValue={defaultValues?.transaction ?? "VENTE"} className={inputClass}>
            {opportunityTransactionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Montant estimé du deal (MAD)" error={state?.fieldErrors?.estimatedAmount}>
          <input type="number" name="estimatedAmount" min="0" step="0.01" defaultValue={defaultValues?.estimatedAmount} className={inputClass} />
        </Field>
        <Field label="Date de clôture estimée" error={state?.fieldErrors?.expectedCloseDate}>
          <input type="date" name="expectedCloseDate" defaultValue={defaultValues?.expectedCloseDate} className={inputClass} />
        </Field>
        {showInitialStage && (
          <Field label="Stade initial" error={state?.fieldErrors?.stage}>
            <select name="stage" defaultValue={defaultValues?.stage ?? "NOUVELLE"} className={inputClass}>
              {openOpportunityStages.map((stage) => (
                <option key={stage} value={stage}>
                  {opportunityStageLabels[stage]} ({defaultStageProbability[stage]} %)
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
      <p className="-mt-3 text-xs text-anthracite-400">
        Montant de la transaction (prix ou loyer), jamais un revenu agence : il alimente le volume pipeline et le prévisionnel pondéré.
      </p>

      <Field label="Agent responsable" error={state?.fieldErrors?.assignedToId}>
        <SearchPicker
          name="assignedToId"
          options={assignableUsers}
          value={assignedToId}
          onChange={setAssignedToId}
          placeholder="Rechercher un agent…"
          emptyLabel="Aucun agent trouvé."
        />
      </Field>

      <Field label="Note interne" error={state?.fieldErrors?.internalNote}>
        <textarea name="internalNote" rows={3} maxLength={4000} defaultValue={defaultValues?.internalNote} className={inputClass} />
      </Field>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
