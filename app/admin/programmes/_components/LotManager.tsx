"use client";

import { useActionState, useState } from "react";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import { createLot, updateLot, type LotFormState } from "@/lib/real-estate-network/lot-actions";
import { lotStatusOptions } from "@/lib/real-estate-network/enum-labels";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";

export type LotDto = {
  id: string;
  reference: string;
  lotType: string | null;
  typology: string | null;
  surface: number | null;
  price: number | null;
  status: string;
  floor: string | null;
  block: string | null;
  extraInfo: string | null;
};

function LotFields({ state, defaultValues }: { state: LotFormState; defaultValues?: Partial<LotDto> }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Référence" error={state?.fieldErrors?.reference}>
          <input name="reference" defaultValue={defaultValues?.reference} required maxLength={80} className={inputClass} />
        </Field>
        <Field label="Type" error={state?.fieldErrors?.lotType}>
          <input name="lotType" defaultValue={defaultValues?.lotType ?? undefined} maxLength={80} className={inputClass} />
        </Field>
        <Field label="Typologie" error={state?.fieldErrors?.typology}>
          <input name="typology" defaultValue={defaultValues?.typology ?? undefined} maxLength={80} className={inputClass} placeholder="Ex. T3" />
        </Field>
        <Field label="Surface (m²)" error={state?.fieldErrors?.surface}>
          <input type="number" step="any" name="surface" defaultValue={defaultValues?.surface ?? undefined} className={inputClass} />
        </Field>
        <Field label="Prix (MAD)" error={state?.fieldErrors?.price}>
          <input type="number" step="any" name="price" defaultValue={defaultValues?.price ?? undefined} className={inputClass} />
        </Field>
        <Field label="Statut" error={state?.fieldErrors?.status}>
          <select name="status" defaultValue={defaultValues?.status ?? "DISPONIBLE"} className={inputClass}>
            {lotStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Étage" error={state?.fieldErrors?.floor}>
          <input name="floor" defaultValue={defaultValues?.floor ?? undefined} maxLength={40} className={inputClass} />
        </Field>
        <Field label="Bloc" error={state?.fieldErrors?.block}>
          <input name="block" defaultValue={defaultValues?.block ?? undefined} maxLength={40} className={inputClass} />
        </Field>
      </div>
      <Field label="Informations complémentaires (JSON, optionnel)" error={state?.fieldErrors?.extraInfo}>
        <textarea name="extraInfo" defaultValue={defaultValues?.extraInfo ?? undefined} rows={2} maxLength={4000} className={inputClass} />
      </Field>
    </>
  );
}

function LotRow({ lot }: { lot: LotDto }) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateLot.bind(null, lot.id);
  const [state, formAction, pending] = useActionState(boundUpdate, undefined);

  if (!editing) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-anthracite-900">{lot.reference}</span>
          <span className="text-xs text-anthracite-400">
            {[lot.lotType, lot.typology, lot.surface ? `${lot.surface} m²` : null, lot.floor, lot.block].filter(Boolean).join(" · ")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="outline">{lotStatusOptions.find((option) => option.value === lot.status)?.label ?? lot.status}</Badge>
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-gold-600 hover:underline">
            Modifier
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-gold-300 bg-gold-50/30 p-4">
      <form action={formAction} className="flex flex-col gap-3">
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        <LotFields state={state} defaultValues={lot} />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-anthracite-500 hover:text-gold-600">
            Annuler
          </button>
        </div>
      </form>
    </li>
  );
}

export default function LotManager({ programId, lots }: { programId: string; lots: LotDto[] }) {
  const boundCreate = createLot.bind(null, programId);
  const [state, formAction, pending] = useActionState(boundCreate, undefined);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold text-anthracite-950">Lots ({lots.length})</h2>

      {lots.length === 0 ? (
        <p className="text-sm text-anthracite-400">Aucun lot pour ce programme.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lots.map((lot) => (
            <LotRow key={lot.id} lot={lot} />
          ))}
        </ul>
      )}

      <details className="rounded-2xl border border-dashed border-anthracite-200 p-4">
        <summary className="cursor-pointer text-sm font-medium text-anthracite-700">+ Ajouter un lot</summary>
        <form action={formAction} className="mt-3 flex flex-col gap-3">
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
          <LotFields state={state} />
          <Button type="submit" size="sm" disabled={pending} className="w-fit">
            {pending ? "Création…" : "Ajouter le lot"}
          </Button>
        </form>
      </details>
    </div>
  );
}
