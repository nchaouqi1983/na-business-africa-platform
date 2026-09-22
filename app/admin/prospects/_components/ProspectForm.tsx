"use client";

import { useActionState, useState } from "react";
import Button from "@/components/Button";
import type { ProspectFormState } from "@/lib/crm/prospect-actions";
import {
  prospectTypeOptions,
  prospectLanguageOptions,
  prospectSourceOptions,
  prospectStatusOptions,
} from "@/lib/crm/enum-labels";
import { partyKindOptions } from "@/lib/real-estate-network/enum-labels";
import { propertyTypeFilterOptions, transactionFilterOptions } from "@/lib/admin/property-enum-maps";
import { Field, inputClass, checkboxClass } from "@/app/admin/biens/_components/FormField";
import SearchPicker, { type SearchPickerOption } from "@/app/admin/_components/SearchPicker";

export type ProspectFormDefaults = {
  type?: string;
  kind?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  preferredLanguage?: string;
  source?: string;
  status?: string;
  searchCities?: string;
  searchDistricts?: string;
  searchPropertyTypes?: string[];
  searchTransaction?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  projectTimeline?: string;
  internalNotes?: string;
  assignedToId?: string;
};

type Props = {
  action: (prevState: ProspectFormState, formData: FormData) => Promise<ProspectFormState>;
  submitLabel: string;
  defaultValues?: ProspectFormDefaults;
  assignableUsers: SearchPickerOption[];
};

export default function ProspectForm({ action, submitLabel, defaultValues, assignableUsers }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [kind, setKind] = useState(defaultValues?.kind ?? "PHYSIQUE");
  const [assignedToId, setAssignedToId] = useState(defaultValues?.assignedToId ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type de prospect" error={state?.fieldErrors?.type}>
          <select name="type" defaultValue={defaultValues?.type ?? "ACHETEUR"} className={inputClass}>
            {prospectTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Personne physique ou société" error={state?.fieldErrors?.kind}>
          <select name="kind" value={kind} onChange={(event) => setKind(event.target.value)} className={inputClass}>
            {partyKindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        {kind === "PHYSIQUE" ? (
          <>
            <Field label="Prénom" error={state?.fieldErrors?.firstName}>
              <input type="text" name="firstName" defaultValue={defaultValues?.firstName} maxLength={100} className={inputClass} />
            </Field>
            <Field label="Nom" error={state?.fieldErrors?.lastName}>
              <input type="text" name="lastName" defaultValue={defaultValues?.lastName} maxLength={100} className={inputClass} />
            </Field>
          </>
        ) : (
          <Field label="Nom de la société" error={state?.fieldErrors?.companyName}>
            <input type="text" name="companyName" defaultValue={defaultValues?.companyName} maxLength={200} className={inputClass} />
          </Field>
        )}

        <Field label="Téléphone" error={state?.fieldErrors?.phone}>
          <input type="tel" name="phone" defaultValue={defaultValues?.phone} required maxLength={30} className={inputClass} />
        </Field>

        <Field label="E-mail" error={state?.fieldErrors?.email}>
          <input type="email" name="email" defaultValue={defaultValues?.email} maxLength={200} className={inputClass} />
        </Field>

        <Field label="Langue préférée" error={state?.fieldErrors?.preferredLanguage}>
          <select name="preferredLanguage" defaultValue={defaultValues?.preferredLanguage ?? "FR"} className={inputClass}>
            {prospectLanguageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Source" error={state?.fieldErrors?.source}>
          <select name="source" defaultValue={defaultValues?.source ?? "AUTRE"} className={inputClass}>
            {prospectSourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Statut" error={state?.fieldErrors?.status}>
          <select name="status" defaultValue={defaultValues?.status ?? "NOUVEAU"} className={inputClass}>
            {prospectStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Transaction recherchée" error={state?.fieldErrors?.searchTransaction}>
          <select name="searchTransaction" defaultValue={defaultValues?.searchTransaction ?? ""} className={inputClass}>
            <option value="">Non précisée</option>
            {transactionFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Villes recherchées" error={state?.fieldErrors?.searchCities}>
          <input
            type="text"
            name="searchCities"
            defaultValue={defaultValues?.searchCities}
            placeholder="Casablanca, Rabat…"
            className={inputClass}
          />
        </Field>

        <Field label="Quartiers recherchés" error={state?.fieldErrors?.searchDistricts}>
          <input
            type="text"
            name="searchDistricts"
            defaultValue={defaultValues?.searchDistricts}
            placeholder="Gauthier, Agdal…"
            className={inputClass}
          />
        </Field>

        <Field label="Budget min (MAD)" error={state?.fieldErrors?.budgetMin}>
          <input type="number" name="budgetMin" min="0" step="0.01" defaultValue={defaultValues?.budgetMin} className={inputClass} />
        </Field>

        <Field label="Budget max (MAD)" error={state?.fieldErrors?.budgetMax}>
          <input type="number" name="budgetMax" min="0" step="0.01" defaultValue={defaultValues?.budgetMax} className={inputClass} />
        </Field>

        <Field label="Devise" error={state?.fieldErrors?.currency}>
          <input type="text" name="currency" defaultValue={defaultValues?.currency ?? "MAD"} maxLength={10} className={inputClass} />
        </Field>

        <Field label="Échéance / projet" error={state?.fieldErrors?.projectTimeline}>
          <input
            type="text"
            name="projectTimeline"
            defaultValue={defaultValues?.projectTimeline}
            placeholder="Ex. 3 mois, T1 2027…"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Types de biens recherchés">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {propertyTypeFilterOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-anthracite-800">
              <input
                type="checkbox"
                name="searchPropertyTypes"
                value={option.value}
                defaultChecked={defaultValues?.searchPropertyTypes?.includes(option.value)}
                className={checkboxClass}
              />
              {option.label}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Agent assigné">
        <SearchPicker
          name="assignedToId"
          options={assignableUsers}
          value={assignedToId}
          onChange={setAssignedToId}
          placeholder="Rechercher un agent…"
          emptyLabel="Aucun agent trouvé."
        />
      </Field>

      <Field label="Notes internes" error={state?.fieldErrors?.internalNotes}>
        <textarea name="internalNotes" defaultValue={defaultValues?.internalNotes} rows={4} maxLength={4000} className={inputClass} />
      </Field>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
