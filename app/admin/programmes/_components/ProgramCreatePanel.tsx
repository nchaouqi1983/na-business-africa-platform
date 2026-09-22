"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { createProgram } from "@/lib/real-estate-network/program-actions";
import { createPromoter } from "@/lib/real-estate-network/promoter-actions";
import { programStatusOptions } from "@/lib/real-estate-network/enum-labels";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";

type PromoterOption = { id: string; companyName: string };

type Props = {
  initialPromoters: PromoterOption[];
};

export default function ProgramCreatePanel({ initialPromoters }: Props) {
  const router = useRouter();
  const [promoters, setPromoters] = useState(initialPromoters);
  const [promoterSearch, setPromoterSearch] = useState("");
  const [promoterId, setPromoterId] = useState("");
  const [quickPromoterName, setQuickPromoterName] = useState("");
  const [pending, startTransition] = useTransition();
  const [state, formAction, formPending] = useActionState(createProgram, undefined);

  useEffect(() => {
    if (state?.program) router.refresh();
  }, [state, router]);

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
    <details className="rounded-2xl border border-dashed border-anthracite-200 bg-white p-6">
      <summary className="cursor-pointer text-sm font-medium text-anthracite-700">+ Nouveau programme</summary>
      <form action={formAction} className="mt-4 flex flex-col gap-6">
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
            {filteredPromoters.length === 0 && (
              <div className="flex flex-wrap items-end gap-2 rounded-xl border border-anthracite-100 bg-anthracite-50 p-3">
                <input
                  type="text"
                  value={quickPromoterName}
                  onChange={(event) => setQuickPromoterName(event.target.value)}
                  placeholder="Nouvelle raison sociale"
                  className={inputClass}
                />
                <Button type="button" size="sm" disabled={pending} onClick={handleQuickCreatePromoter}>
                  Créer le promoteur
                </Button>
              </div>
            )}
          </div>
          {promoterId && (
            <p className="mt-1 text-xs text-anthracite-500">
              Sélectionné : {promoters.find((promoter) => promoter.id === promoterId)?.companyName}
            </p>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du programme" error={state?.fieldErrors?.name}>
            <input name="name" required maxLength={200} className={inputClass} />
          </Field>
          <Field label="Statut" error={state?.fieldErrors?.status}>
            <select name="status" defaultValue="ETUDE" className={inputClass}>
              {programStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ville" error={state?.fieldErrors?.city}>
            <input name="city" required maxLength={120} className={inputClass} />
          </Field>
          <Field label="Quartier" error={state?.fieldErrors?.district}>
            <input name="district" maxLength={120} className={inputClass} />
          </Field>
          <Field label="Adresse" error={state?.fieldErrors?.address}>
            <input name="address" maxLength={240} className={inputClass} />
          </Field>
          <Field label="Livraison prévue" error={state?.fieldErrors?.expectedDeliveryDate}>
            <input type="date" name="expectedDeliveryDate" className={inputClass} />
          </Field>
          <Field label="Nombre de lots indicatif" error={state?.fieldErrors?.indicativeLotCount}>
            <input type="number" min={0} name="indicativeLotCount" className={inputClass} />
          </Field>
        </div>

        <Field label="Description interne" error={state?.fieldErrors?.internalDescription}>
          <textarea name="internalDescription" rows={3} maxLength={4000} className={inputClass} />
        </Field>

        <Button type="submit" disabled={formPending} className="w-fit">
          {formPending ? "Création…" : "Créer le programme"}
        </Button>
      </form>
    </details>
  );
}
