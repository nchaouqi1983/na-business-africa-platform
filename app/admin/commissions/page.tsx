import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageFinance } from "@/lib/finance/permissions";
import { listCommissionCases } from "@/lib/finance/commission-queries";
import {
  commissionCaseStatusLabels,
  commissionCaseStatusOptions,
  commissionTransactionTypeLabels,
  commissionTransactionTypeOptions,
} from "@/lib/finance/enum-labels";
import { madAmount } from "@/lib/admin/format";
import Badge from "@/components/Badge";

export const metadata: Metadata = {
  title: "Commissions | NA Business Africa",
};

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

const statusTone: Record<string, "gold" | "anthracite" | "outline"> = {
  PREVISION: "outline",
  A_CONFIRMER: "outline",
  DUE: "anthracite",
  PARTIELLEMENT_PAYEE: "gold",
  PAYEE: "gold",
  ANNULEE: "anthracite",
};

export default async function CommissionCasesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireAdminUser();

  if (!canManageFinance(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas d&apos;accéder aux commissions.</p>
      </div>
    );
  }

  const sp = await searchParams;
  const q = paramValue(sp.q);
  const status = paramValue(sp.statut);
  const transaction = paramValue(sp.transaction);
  const page = Number(paramValue(sp.page)) || 1;

  const { items, total, pageCount, totals } = await listCommissionCases({ q, status, transaction, page });
  const hasFilters = Boolean(q || status || transaction);
  const remaining = totals.totalAgencyCommission - totals.totalPaid;

  function buildHref(overrides: Record<string, string>): string {
    const params = new URLSearchParams({
      ...(q ? { q } : {}),
      ...(status ? { statut: status } : {}),
      ...(transaction ? { transaction } : {}),
      ...overrides,
    });
    const query = params.toString();
    return query ? `/admin/commissions?${query}` : "/admin/commissions";
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Commissions</span>
        <h1 className="font-display text-3xl font-semibold text-anthracite-950">
          {total} dossier{total > 1 ? "s" : ""}
        </h1>
      </div>

      <div className="grid gap-4 rounded-2xl border border-anthracite-100 bg-white p-6 sm:grid-cols-3">
        <Info label="Commission agence totale (filtrée)" value={madAmount(totals.totalAgencyCommission)} />
        <Info label="Total payé" value={madAmount(totals.totalPaid)} />
        <Info label="Reste dû" value={madAmount(remaining)} />
      </div>

      <form method="get" className="flex flex-col gap-4 rounded-2xl border border-anthracite-100 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Recherche</span>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Référence, bien…"
              className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Statut</span>
            <select name="statut" defaultValue={status} className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500">
              <option value="">Tous</option>
              {commissionCaseStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Transaction</span>
            <select
              name="transaction"
              defaultValue={transaction}
              className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500"
            >
              <option value="">Toutes</option>
              {commissionTransactionTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="w-fit rounded-full bg-anthracite-950 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-anthracite-800">
            Filtrer
          </button>
          {hasFilters && (
            <Link href="/admin/commissions" className="text-sm text-anthracite-500 hover:text-gold-600">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-anthracite-200 bg-white p-16 text-center">
          <p className="font-display text-lg text-anthracite-900">
            {hasFilters ? "Aucun dossier ne correspond à ces critères." : "Aucun dossier de commission pour le moment."}
          </p>
          <p className="text-sm text-anthracite-500">Un dossier se crée depuis un mandat ou depuis le dossier d&apos;un bien.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-anthracite-100 bg-white">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-anthracite-100 text-xs font-semibold uppercase tracking-wider text-anthracite-400">
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Bien</th>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Commission agence</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-anthracite-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-anthracite-900">{item.reference}</td>
                  <td className="px-4 py-3 text-anthracite-600">
                    {item.property.titleFr}
                    <span className="block text-xs text-anthracite-400">{item.property.reference}</span>
                  </td>
                  <td className="px-4 py-3 text-anthracite-600">{commissionTransactionTypeLabels[item.transaction]}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[item.status] ?? "outline"}>{commissionCaseStatusLabels[item.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-anthracite-600">{madAmount(Number(item.agencyCommissionAmount))}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/commissions/${item.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-500">
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <Link
              key={pageNumber}
              href={buildHref({ page: String(pageNumber) })}
              className={[
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
                pageNumber === page ? "bg-anthracite-900 text-white" : "border border-anthracite-200 text-anthracite-600 hover:border-gold-400",
              ].join(" ")}
            >
              {pageNumber}
            </Link>
          ))}
        </div>
      )}
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
