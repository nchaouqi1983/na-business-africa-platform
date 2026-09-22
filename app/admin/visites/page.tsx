import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { listVisits } from "@/lib/crm/visit-queries";
import { listCrmAssignableUsers } from "@/lib/crm/prospect-queries";
import { visitStatusLabels, visitStatusOptions, visitTypeLabels } from "@/lib/crm/enum-labels";
import { formatDateTime } from "@/lib/admin/format";
import { roleLabels } from "@/lib/auth/roles";
import Badge from "@/components/Badge";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Visites | NA Business Africa",
};

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function prospectLabel(prospect: { firstName: string | null; lastName: string | null; companyName: string | null }): string {
  return prospect.companyName || [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || "Prospect sans nom";
}

const statusTone: Record<string, "gold" | "anthracite" | "outline"> = {
  PLANIFIEE: "gold",
  CONFIRMEE: "gold",
  REALISEE: "anthracite",
  ANNULEE: "outline",
  ABSENT: "outline",
};

export default async function VisitesPage({ searchParams }: PageProps<"/admin/visites">) {
  const user = await requireAdminUser();
  const sp = await searchParams;

  const status = paramValue(sp.statut);
  const assignedToId = paramValue(sp.agent);
  const city = paramValue(sp.ville);
  const dateFrom = paramValue(sp.debut);
  const dateTo = paramValue(sp.fin);
  const page = Number(paramValue(sp.page)) || 1;

  const [{ items, total, pageCount }, users] = await Promise.all([
    listVisits(user.role, user.id, { status, assignedToId, city, dateFrom, dateTo, page }),
    listCrmAssignableUsers(),
  ]);
  const hasFilters = Boolean(status || assignedToId || city || dateFrom || dateTo);

  function buildHref(overrides: Record<string, string>): string {
    const params = new URLSearchParams({
      ...(status ? { statut: status } : {}),
      ...(assignedToId ? { agent: assignedToId } : {}),
      ...(city ? { ville: city } : {}),
      ...(dateFrom ? { debut: dateFrom } : {}),
      ...(dateTo ? { fin: dateTo } : {}),
      ...overrides,
    });
    const query = params.toString();
    return query ? `/admin/visites?${query}` : "/admin/visites";
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Visites</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">
            {total} visite{total > 1 ? "s" : ""}
          </h1>
        </div>
        <Button href="/admin/visites/nouveau" size="sm">
          + Nouvelle visite
        </Button>
      </div>

      <form method="get" className="flex flex-col gap-4 rounded-2xl border border-anthracite-100 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Statut</span>
            <select name="statut" defaultValue={status} className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500">
              <option value="">Tous</option>
              {visitStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Agent</span>
            <select name="agent" defaultValue={assignedToId} className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500">
              <option value="">Tous</option>
              {users.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name ?? candidate.email} ({roleLabels[candidate.role]})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Ville</span>
            <input type="text" name="ville" defaultValue={city} className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Du</span>
            <input type="date" name="debut" defaultValue={dateFrom} className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Au</span>
            <input type="date" name="fin" defaultValue={dateTo} className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500" />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="w-fit rounded-full bg-anthracite-950 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-anthracite-800">
            Filtrer
          </button>
          {hasFilters && (
            <Link href="/admin/visites" className="text-sm text-anthracite-500 hover:text-gold-600">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-anthracite-200 bg-white p-16 text-center">
          <p className="font-display text-lg text-anthracite-900">
            {hasFilters ? "Aucune visite ne correspond à ces critères." : "Aucune visite planifiée pour le moment."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-anthracite-100 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-anthracite-100 text-xs font-semibold uppercase tracking-wider text-anthracite-400">
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Bien</th>
                <th className="px-4 py-3">Prospect</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Agent</th>
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
                  <td className="px-4 py-3 text-anthracite-600">{prospectLabel(item.prospect)}</td>
                  <td className="px-4 py-3 text-anthracite-600">{formatDateTime(item.scheduledStart)}</td>
                  <td className="px-4 py-3 text-anthracite-600">{visitTypeLabels[item.type]}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[item.status] ?? "outline"}>{visitStatusLabels[item.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-anthracite-600">{item.assignedTo?.name ?? item.assignedTo?.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/visites/${item.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-500">
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
