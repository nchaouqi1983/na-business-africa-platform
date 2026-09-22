"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addCommissionShare,
  updateCommissionShare,
  removeCommissionShare,
  type CommissionShareFormState,
} from "@/lib/finance/commission-actions";
import {
  commissionBeneficiaryTypeOptions,
  commissionBeneficiaryTypeLabels,
  commissionShareModeOptions,
  commissionShareModeLabels,
  commissionShareStatusOptions,
  commissionShareStatusLabels,
} from "@/lib/finance/enum-labels";
import { madAmount } from "@/lib/admin/format";
import Badge from "@/components/Badge";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";

export type SharePickerOption = { id: string; label: string };

export type CommissionShareDto = {
  id: string;
  beneficiaryType: string;
  intermediaryId: string | null;
  intermediary: { id: string; nameOrCompany: string } | null;
  userId: string | null;
  user: { id: string; name: string | null; email: string } | null;
  freeBeneficiaryName: string | null;
  mode: string;
  value: number;
  computedAmount: number;
  status: string;
  notes: string | null;
  paidTotal: number;
};

type Props = {
  commissionCaseId: string;
  agencyCommissionAmount: number;
  currency: string;
  initialShares: CommissionShareDto[];
  pickerIntermediaries: SharePickerOption[];
  pickerUsers: SharePickerOption[];
};

function beneficiaryLabel(share: CommissionShareDto): string {
  if (share.beneficiaryType === "INTERMEDIAIRE") return share.intermediary?.nameOrCompany ?? "Intermédiaire";
  if (share.beneficiaryType === "AGENT_INTERNE") return share.user?.name ?? share.user?.email ?? "Agent interne";
  if (share.beneficiaryType === "AUTRE") return share.freeBeneficiaryName ?? "Autre";
  return commissionBeneficiaryTypeLabels.AGENCE;
}

export default function CommissionShareManager({
  commissionCaseId,
  agencyCommissionAmount,
  currency,
  initialShares,
  pickerIntermediaries,
  pickerUsers,
}: Props) {
  const router = useRouter();
  const sharesTotal = initialShares.reduce((sum, share) => sum + share.computedAmount, 0);
  const remaining = agencyCommissionAmount - sharesTotal;
  const boundAddShare = addCommissionShare.bind(null, commissionCaseId);
  const [addState, addFormAction, addPending] = useActionState<CommissionShareFormState, FormData>(boundAddShare, undefined);
  const [, startTransition] = useTransition();

  const wasPending = addPending;
  useEffect(() => {
    if (!wasPending && addState && !addState.error) {
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wasPending]);

  function remove(shareId: string) {
    if (!window.confirm("Retirer cette part ?")) return;
    startTransition(async () => {
      await removeCommissionShare(shareId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-anthracite-950">Parts ({initialShares.length})</h3>
        <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">
          Réparti : {madAmount(sharesTotal)} {currency} · Reste agence : {madAmount(remaining)} {currency}
        </span>
      </div>

      {initialShares.length === 0 ? (
        <p className="text-sm text-anthracite-400">Aucune part répartie pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {initialShares.map((share) => (
            <li key={share.id} className="rounded-xl border border-anthracite-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-anthracite-900">
                    {commissionBeneficiaryTypeLabels[share.beneficiaryType as keyof typeof commissionBeneficiaryTypeLabels]} —{" "}
                    {beneficiaryLabel(share)}
                  </span>
                  <span className="text-xs text-anthracite-500">
                    {commissionShareModeLabels[share.mode as keyof typeof commissionShareModeLabels]} :{" "}
                    {share.mode === "POURCENTAGE" ? `${share.value}%` : madAmount(share.value)} → {madAmount(share.computedAmount)}{" "}
                    {currency}
                  </span>
                  <span className="text-xs text-anthracite-400">
                    Payé : {madAmount(share.paidTotal)} {currency} · Restant : {madAmount(share.computedAmount - share.paidTotal)} {currency}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={share.status === "PAYE" ? "gold" : "outline"}>
                    {commissionShareStatusLabels[share.status as keyof typeof commissionShareStatusLabels]}
                  </Badge>
                  <button type="button" onClick={() => remove(share.id)} className="text-xs font-semibold text-red-600 hover:underline">
                    Retirer
                  </button>
                </div>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-anthracite-500">Modifier</summary>
                <div className="mt-3">
                  <ShareEditForm
                    shareId={share.id}
                    share={share}
                    pickerIntermediaries={pickerIntermediaries}
                    pickerUsers={pickerUsers}
                    onSaved={() => router.refresh()}
                  />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <details className="rounded-2xl border border-dashed border-anthracite-200 p-4">
        <summary className="cursor-pointer text-sm font-medium text-anthracite-700">+ Ajouter une part</summary>
        <form action={addFormAction} className="mt-3 flex flex-col gap-3">
          {addState?.error && <p className="text-xs text-red-600">{addState.error}</p>}
          <ShareFields defaultValues={undefined} fieldErrors={addState?.fieldErrors} pickerIntermediaries={pickerIntermediaries} pickerUsers={pickerUsers} />
          <button
            type="submit"
            disabled={addPending}
            className="w-fit rounded-full bg-anthracite-950 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-anthracite-800 disabled:cursor-not-allowed disabled:bg-anthracite-300"
          >
            {addPending ? "Ajout…" : "Ajouter la part"}
          </button>
        </form>
      </details>
    </div>
  );
}

function ShareEditForm({
  shareId,
  share,
  pickerIntermediaries,
  pickerUsers,
  onSaved,
}: {
  shareId: string;
  share: CommissionShareDto;
  pickerIntermediaries: SharePickerOption[];
  pickerUsers: SharePickerOption[];
  onSaved: () => void;
}) {
  const boundUpdate = updateCommissionShare.bind(null, shareId);
  const [state, formAction, pending] = useActionState<CommissionShareFormState, FormData>(boundUpdate, undefined);

  const wasPending = pending;
  useEffect(() => {
    if (!wasPending && state && !state.error) onSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wasPending]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <ShareFields
        defaultValues={{
          beneficiaryType: share.beneficiaryType,
          intermediaryId: share.intermediaryId ?? undefined,
          userId: share.userId ?? undefined,
          freeBeneficiaryName: share.freeBeneficiaryName ?? undefined,
          mode: share.mode,
          value: share.value,
          status: share.status,
          notes: share.notes ?? undefined,
        }}
        fieldErrors={state?.fieldErrors}
        pickerIntermediaries={pickerIntermediaries}
        pickerUsers={pickerUsers}
      />
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full border border-anthracite-300 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-anthracite-800 hover:border-gold-500 disabled:cursor-not-allowed"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

function ShareFields({
  defaultValues,
  fieldErrors,
  pickerIntermediaries,
  pickerUsers,
}: {
  defaultValues?: {
    beneficiaryType?: string;
    intermediaryId?: string;
    userId?: string;
    freeBeneficiaryName?: string;
    mode?: string;
    value?: number;
    status?: string;
    notes?: string;
  };
  fieldErrors?: Record<string, string>;
  pickerIntermediaries: SharePickerOption[];
  pickerUsers: SharePickerOption[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Bénéficiaire" error={fieldErrors?.beneficiaryType}>
        <select name="beneficiaryType" defaultValue={defaultValues?.beneficiaryType ?? "AGENCE"} className={inputClass}>
          {commissionBeneficiaryTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Intermédiaire (si applicable)" error={fieldErrors?.intermediaryId}>
        <select name="intermediaryId" defaultValue={defaultValues?.intermediaryId ?? ""} className={inputClass}>
          <option value="">—</option>
          {pickerIntermediaries.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Agent interne (si applicable)" error={fieldErrors?.userId}>
        <select name="userId" defaultValue={defaultValues?.userId ?? ""} className={inputClass}>
          <option value="">—</option>
          {pickerUsers.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Nom libre (si « Autre »)" error={fieldErrors?.freeBeneficiaryName}>
        <input name="freeBeneficiaryName" defaultValue={defaultValues?.freeBeneficiaryName} maxLength={200} className={inputClass} />
      </Field>
      <Field label="Mode" error={fieldErrors?.mode}>
        <select name="mode" defaultValue={defaultValues?.mode ?? "POURCENTAGE"} className={inputClass}>
          {commissionShareModeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Valeur (% ou montant)" error={fieldErrors?.value}>
        <input type="number" name="value" min="0" step="0.01" required defaultValue={defaultValues?.value} className={inputClass} />
      </Field>
      <Field label="Statut" error={fieldErrors?.status}>
        <select name="status" defaultValue={defaultValues?.status ?? "PREVU"} className={inputClass}>
          {commissionShareStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notes" error={fieldErrors?.notes}>
        <input name="notes" defaultValue={defaultValues?.notes} maxLength={2000} className={inputClass} />
      </Field>
    </div>
  );
}
