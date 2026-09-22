import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import { listIntermediaries } from "@/lib/real-estate-network/intermediary-queries";
import { intermediaryTypeLabels, intermediaryTypeOptions } from "@/lib/real-estate-network/enum-labels";
import Badge from "@/components/Badge";
import IntermediaryCreatePanel from "./_components/IntermediaryCreatePanel";

export const metadata: Metadata = {
  title: "Intermédiaires | NA Business Africa",
};

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function IntermediariesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireAdminUser();

  if (!canManageRealEstateNetwork(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas d&apos;accéder aux intermédiaires.</p>
      </div>
    );
  }

  const sp = await searchParams;
  const q = paramValue(sp.q);
  const type = paramValue(sp.type);
  const isActive = paramValue(sp.actif) as "" | "true" | "false";
  const page = Number(paramValue(sp.page)) || 1;

  const { items, total, pageCount } = await listIntermediaries({ q, type, isActive, page });
  const hasFilters = Boolean(q || type || isActive);

  function buildHref(overrides: Record<string, string>): string {
    const params = new URLSearchParams({
      ...(q ? { q } : {}),
      ...(type ? { type } : {}),
      ...(isActive ? { actif: isActive } : {}),
      ...overrides,
    });
    const query = params.toString();
    return query ? `/admin/intermediaires?${query}` : "/admin/intermediaires";
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Intermédiaires</span>
        <h1 className="font-display text-3xl font-semibold text-anthracite-950">
          {total} intermédiaire{total > 1 ? "s" : ""}
        </h1>
      </div>

      <IntermediaryCreatePanel />

      <form method="get" className="flex flex-col gap-4 rounded-2xl border border-anthracite-100 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Recherche</span>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Nom, ville, téléphone, e-mail…"
              className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Type</span>
            <select name="type" defaultValue={type} className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500">
              <option value="">Tous</option>
              {intermediaryTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Statut</span>
            <select name="actif" defaultValue={isActive} className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500">
              <option value="">Tous</option>
              <option value="true">Actifs</option>
              <option value="false">Inactifs</option>
            </select>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="w-fit rounded-full bg-anthracite-950 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-anthracite-800">
            Filtrer
          </button>
          {hasFilters && (
            <Link href="/admin/intermediaires" className="text-sm text-anthracite-500 hover:text-gold-600">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-anthracite-200 bg-white p-16 text-center">
          <p className="font-display text-lg text-anthracite-900">
            {hasFilters ? "Aucun intermédiaire ne correspond à ces critères." : "Aucun intermédiaire enregistré pour le moment."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-anthracite-100 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-anthracite-100 text-xs font-semibold uppercase tracking-wider text-anthracite-400">
                <th className="px-4 py-3">Nom / raison sociale</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-anthracite-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-anthracite-900">{item.nameOrCompany}</td>
                  <td className="px-4 py-3 text-anthracite-600">{intermediaryTypeLabels[item.type]}</td>
                  <td className="px-4 py-3 text-anthracite-600">{item.city ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={item.isActive ? "gold" : "anthracite"}>{item.isActive ? "Actif" : "Inactif"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/intermediaires/${item.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-500">
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
