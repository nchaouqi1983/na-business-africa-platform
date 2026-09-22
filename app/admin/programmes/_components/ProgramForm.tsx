"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Button from "@/components/Button";
import type { ProgramFormState } from "@/lib/real-estate-network/program-actions";
import { createPromoter } from "@/lib/real-estate-network/promoter-actions";
import { programStatusOptions } from "@/lib/real-estate-network/enum-labels";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";

type PromoterOption = { id: string; companyName: string };

export type ProgramFormDefaults = {
  promoterId: string;
  promoterName: string;
  name?: string;
  city?: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  internalDescription?: string;
  status?: string;
  expectedDeliveryDate?: string;
  indicativeLotCount?: number;
};

type Props = {
  action: (prevState: ProgramFormState, formData: FormData) => Promise<ProgramFormState>;
  submitLabel: string;
  initialPromoters: PromoterOption[];
  defaultValues: ProgramFormDefaults;
};

export default function ProgramForm({ action, submitLabel, initialPromoters, defaultValues }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [promoters, setPromoters] = useState(initialPromoters);
  const [promoterId, setPromoterId] = useState(defaultValues.promoterId);
  const [promoterSearch, setPromoterSearch] = useState("");
  const [quickPromoterName, setQuickPromoterName] = useState("");
  const [creating, startTransition] = useTransition();

  const filteredPromoters = useMemo(() => {
    const needle = promoterSearch.trim().toLowerCase();
    return promoters.filter((promoter) => !needle || promoter.companyName.toLowerCase().includes(needle));
  }, [promoters, promoterSearch]);

  function handleQuickCreatePromoter() {
    if (!quickPromoterName.trim()) return;
    const formData = new FormData();
    formData.set("companyName", quickPromoterName);
    startTransition(async () => {
      const created = await createPromoter(undefined, formData);
      if (created?.promoter) {
        setPromoters((prev) => [...prev, created.promoter!]);
        setPromoterId(created.promoter.id);
        setQuickPromoterName("");
      }
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <input type="hidden" name="promoterId" value={promoterId} />
      <Field label="Promoteur" error={state?.fieldErrors?.promoterId}>
        <input
          type="text"
          value={promoterSearch}
          onChange={(event) => setPromoterSearch(event.target.value)}
          placeholder="Rechercher un promoteur…"
          className={inputClass}
        />
        <div className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto">
          {filteredPromoters.map((promoter) => (
            <button
              key={promoter.id}
              type="button"
              onClick={() => setPromoterId(promoter.id)}
              className={[
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                promoterId === promoter.id ? "border-gold-500 bg-gold-200/30" : "border-anthracite-200 hover:border-gold-300",
              ].join(" ")}
            >
              {promoter.companyName}
            </button>
          ))}
        </div>
        {filteredPromoters.length === 0 && (
          <div className="mt-2 flex flex-wrap items-end gap-2 rounded-xl border border-anthracite-100 bg-anthracite-50 p-3">
            <input
              type="text"
              value={quickPromoterName}
              onChange={(event) => setQuickPromoterName(event.target.value)}
              placeholder="Nouvelle raison sociale"
              className={inputClass}
            />
            <Button type="button" size="sm" disabled={creating} onClick={handleQuickCreatePromoter}>
              Créer le promoteur
            </Button>
          </div>
        )}
        <p className="mt-1 text-xs text-anthracite-500">
          Sélectionné : {promoters.find((promoter) => promoter.id === promoterId)?.companyName ?? defaultValues.promoterName}
        </p>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom du programme" error={state?.fieldErrors?.name}>
          <input name="name" defaultValue={defaultValues.name} required maxLength={200} className={inputClass} />
        </Field>
        <Field label="Statut" error={state?.fieldErrors?.status}>
          <select name="status" defaultValue={defaultValues.status ?? "ETUDE"} className={inputClass}>
            {programStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ville" error={state?.fieldErrors?.city}>
          <input name="city" defaultValue={defaultValues.city} required maxLength={120} className={inputClass} />
        </Field>
        <Field label="Quartier" error={state?.fieldErrors?.district}>
          <input name="district" defaultValue={defaultValues.district} maxLength={120} className={inputClass} />
        </Field>
        <Field label="Adresse" error={state?.fieldErrors?.address}>
          <input name="address" defaultValue={defaultValues.address} maxLength={240} className={inputClass} />
        </Field>
        <Field label="Latitude" error={state?.fieldErrors?.latitude}>
          <input type="number" step="any" name="latitude" defaultValue={defaultValues.latitude} className={inputClass} />
        </Field>
        <Field label="Longitude" error={state?.fieldErrors?.longitude}>
          <input type="number" step="any" name="longitude" defaultValue={defaultValues.longitude} className={inputClass} />
        </Field>
        <Field label="Livraison prévue" error={state?.fieldErrors?.expectedDeliveryDate}>
          <input type="date" name="expectedDeliveryDate" defaultValue={defaultValues.expectedDeliveryDate} className={inputClass} />
        </Field>
        <Field label="Nombre de lots indicatif" error={state?.fieldErrors?.indicativeLotCount}>
          <input type="number" min={0} name="indicativeLotCount" defaultValue={defaultValues.indicativeLotCount} className={inputClass} />
        </Field>
      </div>

      <Field label="Description interne" error={state?.fieldErrors?.internalDescription}>
        <textarea name="internalDescription" defaultValue={defaultValues.internalDescription} rows={3} maxLength={4000} className={inputClass} />
      </Field>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
