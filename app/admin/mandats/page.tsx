import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageFinance } from "@/lib/finance/permissions";
import { listMandates, listExpiringMandates, MANDATE_EXPIRY_WARNING_DAYS } from "@/lib/finance/mandate-queries";
import { mandateTypeLabels, mandateTypeOptions, mandateStatusLabels, mandateStatusOptions } from "@/lib/finance/enum-labels";
import { formatDateTime } from "@/lib/admin/format";
import Badge from "@/components/Badge";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Mandats | NA Business Africa",
};

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

const statusTone: Record<string, "gold" | "anthracite" | "outline"> = {
  BROUILLON: "outline",
  ACTIF: "gold",
  EXPIRE: "anthracite",
  RESILIE: "anthracite",
  FINALISE: "outline",
};

export default async function MandatesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireAdminUser();

  if (!canManageFinance(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas d&apos;accéder aux mandats.</p>
      </div>
    );
  }

  const sp = await searchParams;
  const q = paramValue(sp.q);
  const status = paramValue(sp.statut);
  const type = paramValue(sp.type);
  const expiringOnly = paramValue(sp.expirant) === "1";
  const page = Number(paramValue(sp.page)) || 1;

  const [{ items, total, pageCount }, expiring] = await Promise.all([
    listMandates({ q, status, type, expiringOnly, page }),
    listExpiringMandates(),
  ]);
  const hasFilters = Boolean(q || status || type || expiringOnly);

  function buildHref(overrides: Record<string, string>): string {
    const params = new URLSearchParams({
      ...(q ? { q } : {}),
      ...(status ? { statut: status } : {}),
      ...(type ? { type } : {}),
      ...(expiringOnly ? { expirant: "1" } : {}),
      ...overrides,
    });
    const query = params.toString();
    return query ? `/admin/mandats?${query}` : "/admin/mandats";
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Mandats</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">
            {total} mandat{total > 1 ? "s" : ""}
          </h1>
        </div>
        <Button href="/admin/mandats/nouveau" size="sm">
          + Nouveau mandat
        </Button>
      </div>

      {expiring.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-gold-400 bg-gold-50 p-6">
          <p className="text-sm font-semibold text-anthracite-900">
            {expiring.length} mandat{expiring.length > 1 ? "s" : ""} actif{expiring.length > 1 ? "s" : ""} expire
            {expiring.length > 1 ? "nt" : ""} dans moins de {MANDATE_EXPIRY_WARNING_DAYS} jours
          </p>
          <ul className="flex flex-col gap-1.5">
            {expiring.slice(0, 8).map((mandate) => (
              <li key={mandate.id} className="flex flex-wrap items-center justify-between gap-2 text-sm text-anthracite-700">
                <span>
                  {mandate.reference} — {mandate.property.titleFr}
                </span>
                <span className="text-xs text-anthracite-500">
                  Fin : {mandate.endDate ? formatDateTime(mandate.endDate) : "—"}
                </span>
                <Link href={`/admin/mandats/${mandate.id}`} className="text-xs font-semibold text-gold-700 hover:text-gold-600">
                  Voir
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form method="get" className="flex flex-col gap-4 rounded-2xl border border-anthracite-100 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Recherche</span>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Référence, bien, propriétaire…"
              className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Statut</span>
            <select name="statut" defaultValue={status} className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500">
              <option value="">Tous</option>
              {mandateStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Type</span>
            <select name="type" defaultValue={type} className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500">
              <option value="">Tous</option>
              {mandateTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-anthracite-800">
            <input type="checkbox" name="expirant" value="1" defaultChecked={expiringOnly} className="h-4 w-4 rounded border-anthracite-300" />
            Expire sous {MANDATE_EXPIRY_WARNING_DAYS} jours
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="w-fit rounded-full bg-anthracite-950 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-anthracite-800">
            Filtrer
          </button>
          {hasFilters && (
            <Link href="/admin/mandats" className="text-sm text-anthracite-500 hover:text-gold-600">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-anthracite-200 bg-white p-16 text-center">
          <p className="font-display text-lg text-anthracite-900">
            {hasFilters ? "Aucun mandat ne correspond à ces critères." : "Aucun mandat enregistré pour le moment."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-anthracite-100 bg-white">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-anthracite-100 text-xs font-semibold uppercase tracking-wider text-anthracite-400">
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Bien</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Fin</th>
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
                  <td className="px-4 py-3 text-anthracite-600">{mandateTypeLabels[item.type]}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[item.status] ?? "outline"}>{mandateStatusLabels[item.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-anthracite-600">{item.endDate ? formatDateTime(item.endDate) : "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/mandats/${item.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-500">
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
