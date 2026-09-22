import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageFinance } from "@/lib/finance/permissions";
import { getCommissionCaseById, listMandatesForPropertyPicker, listUsersForCommissionSharePicker } from "@/lib/finance/commission-queries";
import { searchActiveIntermediaries } from "@/lib/real-estate-network/intermediary-queries";
import { updateCommissionCase, setCommissionCaseStatus } from "@/lib/finance/commission-actions";
import {
  commissionTransactionTypeLabels,
  commissionCaseStatusLabels,
  commissionBasisLabels,
  commissionBilledToLabels,
  mandateTypeLabels,
} from "@/lib/finance/enum-labels";
import { madAmount, formatDateTime } from "@/lib/admin/format";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import CommissionCaseForm from "../_components/CommissionCaseForm";
import CommissionShareManager from "../_components/CommissionShareManager";
import CommissionPaymentManager from "../_components/CommissionPaymentManager";

export const metadata: Metadata = {
  title: "Dossier de commission | NA Business Africa",
};

const errorMessages: Record<string, string> = {
  permission: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
  "part-avec-paiements": "Impossible de retirer cette part : elle a déjà des paiements enregistrés. Annulez-les d'abord.",
};

const PAID_STATUSES = new Set(["RECU", "PARTIEL"]);

export default async function CommissionCaseDetailPage({ params, searchParams }: PageProps<"/admin/commissions/[id]">) {
  const user = await requireAdminUser();

  if (!canManageFinance(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas d&apos;accéder à ce dossier.</p>
      </div>
    );
  }

  const { id } = await params;
  const sp = await searchParams;
  const commissionCase = await getCommissionCaseById(id);
  if (!commissionCase) notFound();

  const [mandates, intermediaries, users] = await Promise.all([
    listMandatesForPropertyPicker(commissionCase.propertyId),
    searchActiveIntermediaries(),
    listUsersForCommissionSharePicker(),
  ]);

  const errorParam = typeof sp.erreur === "string" ? sp.erreur : undefined;
  const errorMessage = errorParam ? errorMessages[errorParam] : undefined;

  const agencyCommissionAmount = Number(commissionCase.agencyCommissionAmount);
  const totalPaid = commissionCase.payments
    .filter((payment) => PAID_STATUSES.has(payment.status))
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const shares = commissionCase.shares.map((share) => ({
    id: share.id,
    beneficiaryType: share.beneficiaryType,
    intermediaryId: share.intermediaryId,
    intermediary: share.intermediary,
    userId: share.userId,
    user: share.user,
    freeBeneficiaryName: share.freeBeneficiaryName,
    mode: share.mode,
    value: Number(share.value),
    computedAmount: Number(share.computedAmount),
    status: share.status,
    notes: share.notes,
    paidTotal: share.payments.filter((payment) => PAID_STATUSES.has(payment.status)).reduce((sum, payment) => sum + Number(payment.amount), 0),
  }));

  const shareLabelById = new Map(
    shares.map((share) => [
      share.id,
      share.beneficiaryType === "INTERMEDIAIRE"
        ? (share.intermediary?.nameOrCompany ?? "Intermédiaire")
        : share.beneficiaryType === "AGENT_INTERNE"
          ? (share.user?.name ?? share.user?.email ?? "Agent interne")
          : share.beneficiaryType === "AUTRE"
            ? (share.freeBeneficiaryName ?? "Autre")
            : "Agence",
    ])
  );

  const payments = commissionCase.payments.map((payment) => ({
    id: payment.id,
    commissionShareId: payment.commissionShareId,
    shareLabel: payment.commissionShareId ? (shareLabelById.get(payment.commissionShareId) ?? null) : null,
    amount: Number(payment.amount),
    expectedDate: payment.expectedDate ? payment.expectedDate.toISOString().slice(0, 10) : null,
    paidDate: payment.paidDate ? payment.paidDate.toISOString().slice(0, 10) : null,
    status: payment.status,
    internalReference: payment.internalReference,
    paymentMethod: payment.paymentMethod,
    internalNote: payment.internalNote,
  }));

  const boundUpdate = updateCommissionCase.bind(null, commissionCase.id);

  return (
    <div className="flex flex-col gap-8">
      {errorMessage && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">{commissionCase.reference}</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">{commissionCase.property.titleFr}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="outline">{commissionTransactionTypeLabels[commissionCase.transaction]}</Badge>
            <Badge tone={commissionCase.status === "PAYEE" ? "gold" : "outline"}>{commissionCaseStatusLabels[commissionCase.status]}</Badge>
            {commissionCase.mandate && <Badge tone="outline">Mandat {commissionCase.mandate.reference}</Badge>}
          </div>
          <Link href={`/admin/biens/${commissionCase.property.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-500">
            Voir le bien ({commissionCase.property.reference})
          </Link>
        </div>

        <form action={setCommissionCaseStatus.bind(null, commissionCase.id, commissionCase.status === "ANNULEE" ? "PREVISION" : "ANNULEE")}>
          <Button type="submit" variant="ghost" size="sm" className="border border-anthracite-200 hover:border-gold-500">
            {commissionCase.status === "ANNULEE" ? "Réactiver" : "Annuler le dossier"}
          </Button>
        </form>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Calcul</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-anthracite-700">
          <span className="rounded-xl bg-anthracite-50 px-4 py-2">
            Base ({commissionBasisLabels[commissionCase.basis]}) : {madAmount(Number(commissionCase.baseAmount))} {commissionCase.currency}
          </span>
          <span className="text-anthracite-300">→</span>
          <span className="rounded-xl bg-anthracite-50 px-4 py-2">
            Commission agence
            {commissionCase.agencyCommissionRate ? ` (${Number(commissionCase.agencyCommissionRate)}%)` : ""} :{" "}
            {madAmount(agencyCommissionAmount)} {commissionCase.currency}
          </span>
          <span className="text-anthracite-300">→</span>
          <span className="rounded-xl bg-anthracite-50 px-4 py-2">
            Payé : {madAmount(totalPaid)} {commissionCase.currency}
          </span>
          <span className="text-anthracite-300">→</span>
          <span className="rounded-xl bg-anthracite-50 px-4 py-2">
            Restant dû : {madAmount(agencyCommissionAmount - totalPaid)} {commissionCase.currency}
          </span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Facturée à" value={commissionCase.billedTo ? commissionBilledToLabels[commissionCase.billedTo] : "—"} />
          <Info
            label="Prix final de transaction"
            value={commissionCase.finalTransactionAmount ? `${madAmount(Number(commissionCase.finalTransactionAmount))} ${commissionCase.currency}` : "—"}
          />
          <Info
            label="Date prévue d'encaissement"
            value={commissionCase.expectedCollectionDate ? formatDateTime(commissionCase.expectedCollectionDate) : "—"}
          />
          <Info label="Créé par" value={commissionCase.createdBy.name ?? commissionCase.createdBy.email} />
        </div>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Modifier le dossier</h2>
        <div className="mt-6">
          <CommissionCaseForm
            action={boundUpdate}
            submitLabel="Enregistrer les modifications"
            pickerMandates={mandates.map((mandate) => ({ id: mandate.id, label: `${mandate.reference} — ${mandateTypeLabels[mandate.type]}` }))}
            defaultValues={{
              mandateId: commissionCase.mandateId ?? undefined,
              transaction: commissionCase.transaction,
              status: commissionCase.status,
              basis: commissionCase.basis,
              baseAmount: Number(commissionCase.baseAmount),
              agencyCommissionRate: commissionCase.agencyCommissionRate ? Number(commissionCase.agencyCommissionRate) : undefined,
              agencyCommissionAmountInput: commissionCase.agencyCommissionRate ? undefined : agencyCommissionAmount,
              billedTo: commissionCase.billedTo ?? undefined,
              currency: commissionCase.currency,
              finalTransactionAmount: commissionCase.finalTransactionAmount ? Number(commissionCase.finalTransactionAmount) : undefined,
              expectedCollectionDate: commissionCase.expectedCollectionDate
                ? commissionCase.expectedCollectionDate.toISOString().slice(0, 10)
                : undefined,
              internalNotes: commissionCase.internalNotes ?? undefined,
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <CommissionShareManager
          commissionCaseId={commissionCase.id}
          agencyCommissionAmount={agencyCommissionAmount}
          currency={commissionCase.currency}
          initialShares={shares}
          pickerIntermediaries={intermediaries.map((item) => ({ id: item.id, label: item.nameOrCompany }))}
          pickerUsers={users.map((item) => ({ id: item.id, label: item.name ?? item.email }))}
        />
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <CommissionPaymentManager
          commissionCaseId={commissionCase.id}
          dueAmount={agencyCommissionAmount}
          totalPaid={totalPaid}
          currency={commissionCase.currency}
          initialPayments={payments}
          pickerShares={shares.map((share) => ({ id: share.id, label: shareLabelById.get(share.id) ?? "Part" }))}
        />
      </div>

      <p className="text-xs text-anthracite-400">
        Statuts « à confirmer », « prévision » et « due » se règlent manuellement ; « partiellement payée » et « payée » sont calculés
        automatiquement à partir des paiements enregistrés.
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-400">{label}</span>
      <span className="text-sm font-medium text-anthracite-900">{value}</span>
    </div>
  );
}
