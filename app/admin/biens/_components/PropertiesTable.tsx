"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/Badge";

export type PropertyRow = {
  id: string;
  reference: string;
  titleFr: string;
  photoUrl: string | null;
  typeLabel: string;
  transactionLabel: string;
  city: string;
  priceLabel: string;
  statusLabel: string;
  publicationLabel: string;
  publicationTone: "gold" | "anthracite" | "outline";
  visibilityLabel: string;
  visibilityTone: "gold" | "anthracite" | "outline";
  mediaCount: number;
  documentCount: number;
  agentName: string;
  updatedAtLabel: string;
  canEdit: boolean;
  canPublish: boolean;
  isArchived: boolean;
  isPublished: boolean;
  publishAction: () => Promise<void>;
  unpublishAction: () => Promise<void>;
};

type SecondaryColumn = {
  key: string;
  label: string;
};

const SECONDARY_COLUMNS: SecondaryColumn[] = [
  { key: "type", label: "Type" },
  { key: "transaction", label: "Transaction" },
  { key: "ville", label: "Ville" },
  { key: "prix", label: "Prix" },
  { key: "statut", label: "Statut" },
  { key: "publication", label: "Publication" },
  { key: "visibilite", label: "Visibilité" },
  { key: "medias", label: "Médias" },
  { key: "agent", label: "Agent" },
  { key: "maj", label: "Dernière modification" },
];

const DEFAULT_VISIBLE = new Set(SECONDARY_COLUMNS.map((c) => c.key));

function RowActions({ property }: { property: PropertyRow }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link href={`/admin/biens/${property.id}`} className="text-xs font-semibold text-gold-600 hover:text-gold-500">
        {property.canEdit ? "Modifier" : "Voir"}
      </Link>
      {property.canPublish && !property.isArchived && !property.isPublished && (
        <form action={property.publishAction}>
          <button
            type="submit"
            className="rounded-full border border-anthracite-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-anthracite-600 hover:border-gold-400 hover:text-anthracite-900"
          >
            Publier
          </button>
        </form>
      )}
      {property.canPublish && !property.isArchived && property.isPublished && (
        <form action={property.unpublishAction}>
          <button
            type="submit"
            className="rounded-full border border-anthracite-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-anthracite-600 hover:border-gold-400 hover:text-anthracite-900"
          >
            Dépublier
          </button>
        </form>
      )}
    </div>
  );
}

function Thumb({ url, title }: { url: string | null; title: string }) {
  if (!url) {
    return <div className="h-11 w-11 shrink-0 rounded-lg bg-anthracite-50" aria-hidden="true" />;
  }
  // eslint-disable-next-line @next/next/no-img-element -- authenticated /api/admin/media route, not an optimizable static asset
  return <img src={url} alt="" title={title} className="h-11 w-11 shrink-0 rounded-lg object-cover" />;
}

/**
 * Presentational only (phase 6L UI fix) — receives fully-resolved rows from
 * the server page, never touches permissions/filters/queries itself. Desktop:
 * a table with photo+référence+titre pinned left and Actions pinned right
 * (only the table scrolls horizontally, never the page). Mobile (<md):
 * compact cards instead of the table, actions always visible.
 */
export default function PropertiesTable({ items }: { items: PropertyRow[] }) {
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(DEFAULT_VISIBLE);
  const [columnsOpen, setColumnsOpen] = useState(false);

  function toggleColumn(key: string) {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const show = (key: string) => visibleColumns.has(key);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative self-end">
        <button
          type="button"
          onClick={() => setColumnsOpen((v) => !v)}
          aria-expanded={columnsOpen}
          className="rounded-full border border-anthracite-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-anthracite-600 hover:border-gold-400 hover:text-anthracite-900"
        >
          Colonnes
        </button>
        {columnsOpen && (
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-anthracite-100 bg-white p-3 shadow-xl">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-anthracite-400">
              Colonnes secondaires
            </p>
            <div className="flex flex-col gap-1.5">
              {SECONDARY_COLUMNS.map((column) => (
                <label key={column.key} className="flex items-center gap-2 text-sm text-anthracite-700">
                  <input
                    type="checkbox"
                    checked={show(column.key)}
                    onChange={() => toggleColumn(column.key)}
                    className="h-4 w-4 rounded border-anthracite-300"
                  />
                  {column.label}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop / tablet: table, only it scrolls horizontally. */}
      <div className="hidden overflow-x-auto rounded-2xl border border-anthracite-100 bg-white md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-anthracite-100 text-xs font-semibold uppercase tracking-wider text-anthracite-400">
              <th className="sticky left-0 z-10 w-14 bg-white px-4 py-3"></th>
              <th className="sticky left-14 z-10 min-w-[130px] whitespace-nowrap bg-white px-4 py-3">Référence</th>
              <th className="min-w-[220px] bg-white px-4 py-3">Titre</th>
              {show("type") && <th className="px-4 py-3">Type</th>}
              {show("transaction") && <th className="px-4 py-3">Transaction</th>}
              {show("ville") && <th className="px-4 py-3">Ville</th>}
              {show("prix") && <th className="px-4 py-3">Prix</th>}
              {show("statut") && <th className="px-4 py-3">Statut</th>}
              {show("publication") && <th className="px-4 py-3">Publication</th>}
              {show("visibilite") && <th className="px-4 py-3">Visibilité</th>}
              {show("medias") && <th className="px-4 py-3">Médias</th>}
              {show("agent") && <th className="px-4 py-3">Agent</th>}
              {show("maj") && <th className="min-w-[160px] whitespace-nowrap px-4 py-3">Dernière modification</th>}
              <th className="sticky right-0 z-10 min-w-[160px] bg-white px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((property) => (
              <tr key={property.id} className="border-b border-anthracite-50 last:border-0">
                <td className="sticky left-0 z-10 bg-white px-4 py-2.5">
                  <Thumb url={property.photoUrl} title={property.titleFr} />
                </td>
                <td className="sticky left-14 z-10 whitespace-nowrap bg-white px-4 py-2.5 font-mono text-xs text-anthracite-600">
                  {property.reference}
                </td>
                <td className="bg-white px-4 py-2.5 font-medium text-anthracite-900">
                  <span className="line-clamp-2">{property.titleFr}</span>
                </td>
                {show("type") && <td className="px-4 py-2.5 text-anthracite-600">{property.typeLabel}</td>}
                {show("transaction") && <td className="px-4 py-2.5 text-anthracite-600">{property.transactionLabel}</td>}
                {show("ville") && <td className="px-4 py-2.5 text-anthracite-600">{property.city}</td>}
                {show("prix") && <td className="px-4 py-2.5 whitespace-nowrap text-anthracite-600">{property.priceLabel}</td>}
                {show("statut") && <td className="px-4 py-2.5 text-anthracite-600">{property.statusLabel}</td>}
                {show("publication") && (
                  <td className="px-4 py-2.5">
                    <Badge tone={property.publicationTone}>{property.publicationLabel}</Badge>
                  </td>
                )}
                {show("visibilite") && (
                  <td className="px-4 py-2.5">
                    <Badge tone={property.visibilityTone}>{property.visibilityLabel}</Badge>
                  </td>
                )}
                {show("medias") && (
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-anthracite-500">
                    {property.mediaCount} photo{property.mediaCount > 1 ? "s" : ""} · {property.documentCount} doc.
                  </td>
                )}
                {show("agent") && <td className="px-4 py-2.5 text-anthracite-600">{property.agentName}</td>}
                {show("maj") && (
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-anthracite-500">{property.updatedAtLabel}</td>
                )}
                <td className="sticky right-0 z-10 bg-white px-4 py-2.5">
                  <RowActions property={property} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: compact cards, actions always visible, no horizontal scroll needed. */}
      <div className="flex flex-col gap-3 md:hidden">
        {items.map((property) => (
          <div key={property.id} className="rounded-2xl border border-anthracite-100 bg-white p-4">
            <div className="flex items-start gap-3">
              <Thumb url={property.photoUrl} title={property.titleFr} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="line-clamp-2 text-sm font-semibold text-anthracite-900">{property.titleFr}</span>
                <span className="font-mono text-xs text-anthracite-500">{property.reference}</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge tone={property.publicationTone}>{property.publicationLabel}</Badge>
                  <Badge tone={property.visibilityTone}>{property.visibilityLabel}</Badge>
                </div>
                <span className="mt-1 text-xs text-anthracite-500">
                  {property.typeLabel} · {property.transactionLabel} · {property.city}
                </span>
                <span className="text-xs text-anthracite-500">{property.priceLabel}</span>
                <span className="text-xs text-anthracite-400">Modifié le {property.updatedAtLabel}</span>
              </div>
            </div>
            <div className="mt-3 border-t border-anthracite-50 pt-3">
              <RowActions property={property} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
