import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { listProperties, listDistinctCities } from "@/lib/admin/property-queries";
import {
  transactionFilterOptions,
  propertyTypeFilterOptions,
  publicationStatusOptions,
  visibilityOptions,
  publicationStatusLabels,
  visibilityLabels,
  transactionFromDb,
  propertyTypeFromDb,
  propertyStatusFromDb,
  propertyStatusLabels,
} from "@/lib/admin/property-enum-maps";
import { transactionLabels, propertyTypeLabels } from "@/lib/property-schema";
import { formatPrice, formatDateTime } from "@/lib/admin/format";
import type {
  PublicationStatus as DbPublicationStatus,
  Visibility as DbVisibility,
} from "@/lib/generated/prisma/client";
import Badge from "@/components/Badge";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Biens | NA Business Africa",
  description: "Liste des biens de l'administration NA Business Africa.",
};

const publicationTone: Record<DbPublicationStatus, "gold" | "anthracite" | "outline"> = {
  BROUILLON: "outline",
  PUBLIE: "gold",
  ARCHIVE: "anthracite",
};

const visibilityTone: Record<DbVisibility, "gold" | "anthracite" | "outline"> = {
  PUBLIC: "outline",
  OFF_MARKET: "anthracite",
  PRIVE: "anthracite",
};

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function matchEnum<T extends string>(value: string, allowed: readonly T[]): T | "" {
  return (allowed as readonly string[]).includes(value) ? (value as T) : "";
}

export default async function AdminPropertiesPage({ searchParams }: PageProps<"/admin/biens">) {
  await requireAdminUser();
  const sp = await searchParams;

  const q = paramValue(sp.q);
  const publication = matchEnum(
    paramValue(sp.publication),
    publicationStatusOptions.map((option) => option.value)
  );
  const visibilite = matchEnum(
    paramValue(sp.visibilite),
    visibilityOptions.map((option) => option.value)
  );
  const transaction = matchEnum(
    paramValue(sp.transaction),
    transactionFilterOptions.map((option) => option.value)
  );
  const type = matchEnum(
    paramValue(sp.type),
    propertyTypeFilterOptions.map((option) => option.value)
  );
  const city = paramValue(sp.ville);
  const page = Number(paramValue(sp.page)) || 1;

  const [{ items, total, pageCount }, cities] = await Promise.all([
    listProperties({
      q,
      publicationStatus: publication,
      visibility: visibilite,
      transaction,
      propertyType: type,
      city,
      page,
    }),
    listDistinctCities(),
  ]);

  function buildHref(overrides: Record<string, string>): string {
    const params = new URLSearchParams({
      ...(q ? { q } : {}),
      ...(publication ? { publication } : {}),
      ...(visibilite ? { visibilite } : {}),
      ...(transaction ? { transaction } : {}),
      ...(type ? { type } : {}),
      ...(city ? { ville: city } : {}),
      ...overrides,
    });
    const query = params.toString();
    return query ? `/admin/biens?${query}` : "/admin/biens";
  }

  const hasFilters = Boolean(q || publication || visibilite || transaction || type || city);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Biens</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">
            {total} bien{total > 1 ? "s" : ""}
          </h1>
        </div>
        <Button href="/admin/biens/nouveau" size="sm">
          Ajouter un bien
        </Button>
      </div>

      <form method="get" className="flex flex-col gap-4 rounded-2xl border border-anthracite-100 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Recherche</span>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Titre, référence, ville…"
              className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Publication</span>
            <select
              name="publication"
              defaultValue={publication}
              className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500"
            >
              <option value="">Tous (hors archives)</option>
              {publicationStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Visibilité</span>
            <select
              name="visibilite"
              defaultValue={visibilite}
              className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500"
            >
              <option value="">Toutes</option>
              {visibilityOptions.map((option) => (
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
              {transactionFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Type</span>
            <select
              name="type"
              defaultValue={type}
              className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500"
            >
              <option value="">Tous</option>
              {propertyTypeFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Ville</span>
            <select
              name="ville"
              defaultValue={city}
              className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500"
            >
              <option value="">Toutes</option>
              {cities.map((cityOption) => (
                <option key={cityOption} value={cityOption}>
                  {cityOption}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm">
            Filtrer
          </Button>
          {hasFilters && (
            <Link href="/admin/biens" className="text-sm text-anthracite-500 hover:text-gold-600">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-anthracite-200 bg-white p-16 text-center">
          <p className="font-display text-lg text-anthracite-900">
            {hasFilters ? "Aucun bien ne correspond à ces critères." : "Aucun bien enregistré pour le moment."}
          </p>
          <p className="max-w-md text-sm text-anthracite-500">
            {hasFilters
              ? "Essayez d'élargir votre recherche ou de réinitialiser les filtres."
              : "Créez le premier bien pour commencer à alimenter le registre."}
          </p>
          {!hasFilters && (
            <Button href="/admin/biens/nouveau" size="sm">
              Ajouter un bien
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-anthracite-100 bg-white">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-anthracite-100 text-xs font-semibold uppercase tracking-wider text-anthracite-400">
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Publication</th>
                <th className="px-4 py-3">Visibilité</th>
                <th className="px-4 py-3">Dernière modification</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((property) => (
                <tr key={property.id} className="border-b border-anthracite-50 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-anthracite-600">{property.reference}</td>
                  <td className="px-4 py-3 font-medium text-anthracite-900">{property.titleFr}</td>
                  <td className="px-4 py-3 text-anthracite-600">
                    {propertyTypeLabels[propertyTypeFromDb[property.propertyType]]}
                  </td>
                  <td className="px-4 py-3 text-anthracite-600">
                    {transactionLabels[transactionFromDb[property.transaction]]}
                  </td>
                  <td className="px-4 py-3 text-anthracite-600">{property.city}</td>
                  <td className="px-4 py-3 text-anthracite-600">
                    {formatPrice(property.price, property.priceOnRequest)}
                  </td>
                  <td className="px-4 py-3 text-anthracite-600">
                    {propertyStatusLabels[propertyStatusFromDb[property.status]]}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={publicationTone[property.publicationStatus]}>
                      {publicationStatusLabels[property.publicationStatus]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={visibilityTone[property.visibility]}>
                      {visibilityLabels[property.visibility]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-anthracite-500">{formatDateTime(property.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/biens/${property.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-500">
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
                pageNumber === page
                  ? "bg-anthracite-900 text-white"
                  : "border border-anthracite-200 text-anthracite-600 hover:border-gold-400",
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
