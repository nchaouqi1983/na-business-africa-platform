"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addCommissionPayment,
  updateCommissionPayment,
  cancelCommissionPayment,
  type CommissionPaymentFormState,
} from "@/lib/finance/commission-actions";
import { commissionPaymentStatusOptions, commissionPaymentStatusLabels } from "@/lib/finance/enum-labels";
import { madAmount } from "@/lib/admin/format";
import Badge from "@/components/Badge";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";

export type PaymentSharePickerOption = { id: string; label: string };

export type CommissionPaymentDto = {
  id: string;
  commissionShareId: string | null;
  shareLabel: string | null;
  amount: number;
  expectedDate: string | null;
  paidDate: string | null;
  status: string;
  internalReference: string | null;
  paymentMethod: string | null;
  internalNote: string | null;
};

type Props = {
  commissionCaseId: string;
  dueAmount: number;
  totalPaid: number;
  currency: string;
  initialPayments: CommissionPaymentDto[];
  pickerShares: PaymentSharePickerOption[];
};

export default function CommissionPaymentManager({ commissionCaseId, dueAmount, totalPaid, currency, initialPayments, pickerShares }: Props) {
  const router = useRouter();
  const remaining = dueAmount - totalPaid;
  const boundAddPayment = addCommissionPayment.bind(null, commissionCaseId);
  const [addState, addFormAction, addPending] = useActionState<CommissionPaymentFormState, FormData>(boundAddPayment, undefined);
  const [, startTransition] = useTransition();

  const wasPending = addPending;
  useEffect(() => {
    if (!wasPending && addState && !addState.error) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wasPending]);

  function cancel(paymentId: string) {
    if (!window.confirm("Annuler ce paiement ?")) return;
    startTransition(async () => {
      await cancelCommissionPayment(paymentId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-anthracite-950">Échéancier / paiements ({initialPayments.length})</h3>
        <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">
          Dû : {madAmount(dueAmount)} {currency} · Payé : {madAmount(totalPaid)} {currency} · Restant : {madAmount(remaining)} {currency}
        </span>
      </div>

      {initialPayments.length === 0 ? (
        <p className="text-sm text-anthracite-400">Aucun paiement enregistré pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {initialPayments.map((payment) => (
            <li key={payment.id} className="rounded-xl border border-anthracite-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-anthracite-900">
                    {madAmount(payment.amount)} {currency} {payment.shareLabel ? `— ${payment.shareLabel}` : "— Agence"}
                  </span>
                  <span className="text-xs text-anthracite-500">
                    {payment.expectedDate ? `Prévu : ${payment.expectedDate}` : ""}
                    {payment.paidDate ? ` · Payé le : ${payment.paidDate}` : ""}
                    {payment.internalReference ? ` · Réf. : ${payment.internalReference}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={payment.status === "RECU" ? "gold" : payment.status === "ANNULE" ? "anthracite" : "outline"}>
                    {commissionPaymentStatusLabels[payment.status as keyof typeof commissionPaymentStatusLabels]}
                  </Badge>
                  {payment.status !== "ANNULE" && (
                    <button type="button" onClick={() => cancel(payment.id)} className="text-xs font-semibold text-red-600 hover:underline">
                      Annuler
                    </button>
                  )}
                </div>
              </div>

              {payment.status !== "ANNULE" && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-anthracite-500">Modifier</summary>
                  <div className="mt-3">
                    <PaymentEditForm paymentId={payment.id} payment={payment} pickerShares={pickerShares} onSaved={() => router.refresh()} />
                  </div>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}

      <details className="rounded-2xl border border-dashed border-anthracite-200 p-4">
        <summary className="cursor-pointer text-sm font-medium text-anthracite-700">+ Ajouter un paiement</summary>
        <form action={addFormAction} className="mt-3 flex flex-col gap-3">
          {addState?.error && <p className="text-xs text-red-600">{addState.error}</p>}
          <PaymentFields defaultValues={undefined} fieldErrors={addState?.fieldErrors} pickerShares={pickerShares} />
          <button
            type="submit"
            disabled={addPending}
            className="w-fit rounded-full bg-anthracite-950 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-anthracite-800 disabled:cursor-not-allowed disabled:bg-anthracite-300"
          >
            {addPending ? "Ajout…" : "Ajouter le paiement"}
          </button>
        </form>
      </details>
    </div>
  );
}

function PaymentEditForm({
  paymentId,
  payment,
  pickerShares,
  onSaved,
}: {
  paymentId: string;
  payment: CommissionPaymentDto;
  pickerShares: PaymentSharePickerOption[];
  onSaved: () => void;
}) {
  const boundUpdate = updateCommissionPayment.bind(null, paymentId);
  const [state, formAction, pending] = useActionState<CommissionPaymentFormState, FormData>(boundUpdate, undefined);

  const wasPending = pending;
  useEffect(() => {
    if (!wasPending && state && !state.error) onSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wasPending]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <PaymentFields
        defaultValues={{
          commissionShareId: payment.commissionShareId ?? undefined,
          amount: payment.amount,
          expectedDate: payment.expectedDate ?? undefined,
          paidDate: payment.paidDate ?? undefined,
          status: payment.status,
          internalReference: payment.internalReference ?? undefined,
          paymentMethod: payment.paymentMethod ?? undefined,
          internalNote: payment.internalNote ?? undefined,
        }}
        fieldErrors={state?.fieldErrors}
        pickerShares={pickerShares}
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

function PaymentFields({
  defaultValues,
  fieldErrors,
  pickerShares,
}: {
  defaultValues?: {
    commissionShareId?: string;
    amount?: number;
    expectedDate?: string;
    paidDate?: string;
    status?: string;
    internalReference?: string;
    paymentMethod?: string;
    internalNote?: string;
  };
  fieldErrors?: Record<string, string>;
  pickerShares: PaymentSharePickerOption[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Part concernée (optionnel)" error={fieldErrors?.commissionShareId}>
        <select name="commissionShareId" defaultValue={defaultValues?.commissionShareId ?? ""} className={inputClass}>
          <option value="">Agence (aucune part)</option>
          {pickerShares.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Montant" error={fieldErrors?.amount}>
        <input type="number" name="amount" min="0" step="0.01" required defaultValue={defaultValues?.amount} className={inputClass} />
      </Field>
      <Field label="Statut" error={fieldErrors?.status}>
        <select name="status" defaultValue={defaultValues?.status ?? "PREVU"} className={inputClass}>
          {commissionPaymentStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Date prévue" error={fieldErrors?.expectedDate}>
        <input type="date" name="expectedDate" defaultValue={defaultValues?.expectedDate} className={inputClass} />
      </Field>
      <Field label="Date de paiement" error={fieldErrors?.paidDate}>
        <input type="date" name="paidDate" defaultValue={defaultValues?.paidDate} className={inputClass} />
      </Field>
      <Field label="Référence interne" error={fieldErrors?.internalReference}>
        <input name="internalReference" defaultValue={defaultValues?.internalReference} maxLength={120} className={inputClass} />
      </Field>
      <Field label="Mode de règlement" error={fieldErrors?.paymentMethod}>
        <input name="paymentMethod" defaultValue={defaultValues?.paymentMethod} maxLength={120} className={inputClass} />
      </Field>
      <Field label="Note interne" error={fieldErrors?.internalNote}>
        <input name="internalNote" defaultValue={defaultValues?.internalNote} maxLength={2000} className={inputClass} />
      </Field>
    </div>
  );
}
