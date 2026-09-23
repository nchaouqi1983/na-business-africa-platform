"use client";

import { useActionState, useState } from "react";
import Button from "@/components/Button";
import type { VisitFormState } from "@/lib/crm/visit-actions";
import { visitStatusOptions, visitTypeOptions, postVisitInterestOptions } from "@/lib/crm/enum-labels";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";
import SearchPicker, { type SearchPickerOption } from "@/app/admin/_components/SearchPicker";

export type VisitFormDefaults = {
  assignedToId?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  status?: string;
  type?: string;
  participantsCount?: number;
  preVisitNote?: string;
  prospectFeedback?: string;
  internalNote?: string;
  postVisitInterest?: string;
  nextFollowUpAt?: string;
};

type Props = {
  action: (prevState: VisitFormState, formData: FormData) => Promise<VisitFormState>;
  submitLabel: string;
  defaultValues?: VisitFormDefaults;
  assignableUsers: SearchPickerOption[];
  /** Only present on the standalone "nouvelle visite" page — absent once the property/prospect are fixed (edit screen). */
  pickerProperties?: SearchPickerOption[];
  pickerProspects?: SearchPickerOption[];
  /** Only present on the edit screen, read-only recap of the fixed property/prospect. */
  fixedProperty?: { reference: string; label: string };
  fixedProspect?: { reference: string; label: string };
  /** Whether the compte-rendu fields (feedback, post-visit interest, next follow-up) should show — only past/edit screens. */
  showReportFields?: boolean;
  /** Pre-selects the property/prospect pickers — used when arriving from a bien or prospect dossier's "planifier une visite" link. */
  initialPropertyId?: string;
  initialProspectId?: string;
  /** Phase 6L: planning a visit from an opportunity links it (re-validated server-side). */
  opportunityId?: string;
};

export default function VisitForm({
  action,
  submitLabel,
  defaultValues,
  assignableUsers,
  pickerProperties,
  pickerProspects,
  fixedProperty,
  fixedProspect,
  showReportFields = false,
  initialPropertyId = "",
  initialProspectId = "",
  opportunityId,
}: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [propertyId, setPropertyId] = useState(initialPropertyId);
  const [prospectId, setProspectId] = useState(initialProspectId);
  const [assignedToId, setAssignedToId] = useState(defaultValues?.assignedToId ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      {opportunityId && <input type="hidden" name="opportunityId" value={opportunityId} />}

      {pickerProperties && (
        <Field label="Bien" error={state?.fieldErrors?.propertyId}>
          <SearchPicker
            name="propertyId"
            options={pickerProperties}
            value={propertyId}
            onChange={setPropertyId}
            placeholder="Rechercher un bien…"
            emptyLabel="Aucun bien trouvé."
          />
        </Field>
      )}
      {fixedProperty && (
        <Field label="Bien">
          <p className={inputClass + " bg-anthracite-50"}>
            {fixedProperty.label} ({fixedProperty.reference})
          </p>
        </Field>
      )}

      {pickerProspects && (
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
      {fixedProspect && (
        <Field label="Prospect">
          <p className={inputClass + " bg-anthracite-50"}>
            {fixedProspect.label} ({fixedProspect.reference})
          </p>
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date et heure de début" error={state?.fieldErrors?.scheduledStart}>
          <input type="datetime-local" name="scheduledStart" required defaultValue={defaultValues?.scheduledStart} className={inputClass} />
        </Field>
        <Field label="Date et heure de fin (optionnel)" error={state?.fieldErrors?.scheduledEnd}>
          <input type="datetime-local" name="scheduledEnd" defaultValue={defaultValues?.scheduledEnd} className={inputClass} />
        </Field>
        <Field label="Type de visite" error={state?.fieldErrors?.type}>
          <select name="type" defaultValue={defaultValues?.type ?? "PREMIERE_VISITE"} className={inputClass}>
            {visitTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Statut" error={state?.fieldErrors?.status}>
          <select name="status" defaultValue={defaultValues?.status ?? "PLANIFIEE"} className={inputClass}>
            {visitStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nombre de participants (optionnel)" error={state?.fieldErrors?.participantsCount}>
          <input type="number" name="participantsCount" min="0" step="1" defaultValue={defaultValues?.participantsCount} className={inputClass} />
        </Field>
      </div>

      <Field label="Agent responsable">
        <SearchPicker
          name="assignedToId"
          options={assignableUsers}
          value={assignedToId}
          onChange={setAssignedToId}
          placeholder="Rechercher un agent…"
          emptyLabel="Aucun agent trouvé."
        />
      </Field>

      <Field label="Note avant visite" error={state?.fieldErrors?.preVisitNote}>
        <textarea name="preVisitNote" defaultValue={defaultValues?.preVisitNote} rows={3} maxLength={2000} className={inputClass} />
      </Field>

      {showReportFields && (
        <>
          <Field label="Retour du prospect" error={state?.fieldErrors?.prospectFeedback}>
            <textarea name="prospectFeedback" defaultValue={defaultValues?.prospectFeedback} rows={3} maxLength={2000} className={inputClass} />
          </Field>
          <Field label="Note interne" error={state?.fieldErrors?.internalNote}>
            <textarea name="internalNote" defaultValue={defaultValues?.internalNote} rows={3} maxLength={2000} className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Intérêt après visite" error={state?.fieldErrors?.postVisitInterest}>
              <select name="postVisitInterest" defaultValue={defaultValues?.postVisitInterest ?? ""} className={inputClass}>
                <option value="">Non renseigné</option>
                {postVisitInterestOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Prochaine relance (optionnel)" error={state?.fieldErrors?.nextFollowUpAt}>
              <input type="datetime-local" name="nextFollowUpAt" defaultValue={defaultValues?.nextFollowUpAt} className={inputClass} />
            </Field>
          </div>
        </>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
