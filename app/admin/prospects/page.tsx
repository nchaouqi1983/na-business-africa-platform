import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { listProspects, listCrmAssignableUsers } from "@/lib/crm/prospect-queries";
import { prospectTypeLabels, prospectTypeOptions, prospectStatusLabels, prospectStatusOptions, prospectSourceOptions } from "@/lib/crm/enum-labels";
import { formatDateTime } from "@/lib/admin/format";
import { roleLabels } from "@/lib/auth/roles";
import Badge from "@/components/Badge";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Prospects | NA Business Africa",
};

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

const statusTone: Record<string, "gold" | "anthracite" | "outline"> = {
  NOUVEAU: "gold",
  A_QUALIFIER: "gold",
  QUALIFIE: "outline",
  VISITE_PLANIFIEE: "outline",
  OFFRE: "outline",
  NEGOCIATION: "outline",
  GAGNE: "anthracite",
  PERDU: "anthracite",
  ARCHIVE: "anthracite",
};

function prospectDisplayName(prospect: { kind: string; firstName: string | null; lastName: string | null; companyName: string | null }): string {
  if (prospect.kind === "SOCIETE" && prospect.companyName) return prospect.companyName;
  return [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || "Prospect sans nom";
}

export default async function ProspectsPage({ searchParams }: PageProps<"/admin/prospects">) {
  const user = await requireAdminUser();
  const sp = await searchParams;

  const q = paramValue(sp.q);
  const status = paramValue(sp.statut);
  const type = paramValue(sp.type);
  const source = paramValue(sp.source);
  const assignedToId = paramValue(sp.agent);
  const city = paramValue(sp.ville);
  const page = Number(paramValue(sp.page)) || 1;

  const [{ items, total, pageCount }, users] = await Promise.all([
    listProspects(user.role, user.id, { q, status, type, source, assignedToId, city, page }),
    listCrmAssignableUsers(),
  ]);
  const hasFilters = Boolean(q || status || type || source || assignedToId || city);

  function buildHref(overrides: Record<string, string>): string {
    const params = new URLSearchParams({
      ...(q ? { q } : {}),
      ...(status ? { statut: status } : {}),
      ...(type ? { type } : {}),
      ...(source ? { source } : {}),
      ...(assignedToId ? { agent: assignedToId } : {}),
      ...(city ? { ville: city } : {}),
      ...overrides,
    });
    const query = params.toString();
    return query ? `/admin/prospects?${query}` : "/admin/prospects";
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Prospects</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">
            {total} prospect{total > 1 ? "s" : ""}
          </h1>
        </div>
        <Button href="/admin/prospects/nouveau" size="sm">
          + Nouveau prospect
        </Button>
      </div>

      <form method="get" className="flex flex-col gap-4 rounded-2xl border border-anthracite-100 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Recherche</span>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Nom, téléphone, e-mail…"
              className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Statut</span>
            <select name="statut" defaultValue={status} className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500">
              <option value="">Tous</option>
              {prospectStatusOptions.map((option) => (
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
              {prospectTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Source</span>
            <select name="source" defaultValue={source} className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500">
              <option value="">Toutes</option>
              {prospectSourceOptions.map((option) => (
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
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Ville recherchée</span>
            <input
              type="text"
              name="ville"
              defaultValue={city}
              placeholder="Casablanca…"
              className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500"
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="w-fit rounded-full bg-anthracite-950 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-anthracite-800">
            Filtrer
          </button>
          {hasFilters && (
            <Link href="/admin/prospects" className="text-sm text-anthracite-500 hover:text-gold-600">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-anthracite-200 bg-white p-16 text-center">
          <p className="font-display text-lg text-anthracite-900">
            {hasFilters ? "Aucun prospect ne correspond à ces critères." : "Aucun prospect enregistré pour le moment."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-anthracite-100 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-anthracite-100 text-xs font-semibold uppercase tracking-wider text-anthracite-400">
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Créé le</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-anthracite-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-anthracite-900">{item.reference}</td>
                  <td className="px-4 py-3 text-anthracite-600">{prospectDisplayName(item)}</td>
                  <td className="px-4 py-3 text-anthracite-600">{prospectTypeLabels[item.type]}</td>
                  <td className="px-4 py-3 text-anthracite-600">{item.phone}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[item.status] ?? "outline"}>{prospectStatusLabels[item.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-anthracite-600">{item.assignedTo?.name ?? item.assignedTo?.email ?? "—"}</td>
                  <td className="px-4 py-3 text-anthracite-600">{formatDateTime(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/prospects/${item.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-500">
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
