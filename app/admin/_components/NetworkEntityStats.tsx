import Link from "next/link";
import { madAmount } from "@/lib/admin/format";
import type { NetworkEntityStats } from "@/lib/admin/network-stats-types";

type Tile = { label: string; value: string; href?: string };

/**
 * 360° dashboard section shared by the Owner/Promoter/Intermediary detail
 * pages (phase 6K §4). `propertiesHref` is the base /admin/biens URL already
 * scoped to this entity (e.g. `/admin/biens?proprietaire_id=...`) — each
 * property-related tile appends its own extra filter on top of it.
 * Never labelled "chiffre d'affaires": exact labels "Commissions prévues"
 * and "Commissions encaissées", shown only when the caller passed non-null
 * amounts (i.e. the viewer is SUPER_ADMIN/ADMIN).
 */
export default function NetworkEntityStats({ stats, propertiesHref }: { stats: NetworkEntityStats; propertiesHref: string }) {
  const tiles: Tile[] = [
    { label: "Biens liés", value: String(stats.propertiesTotal), href: propertiesHref },
    { label: "Publiés", value: String(stats.propertiesPublished), href: `${propertiesHref}&publication=PUBLIE` },
    { label: "Brouillons", value: String(stats.propertiesDraft), href: `${propertiesHref}&publication=BROUILLON` },
    { label: "Off-market", value: String(stats.propertiesOffMarket), href: `${propertiesHref}&visibilite=OFF_MARKET` },
    { label: "Mandats actifs", value: String(stats.activeMandates), href: `${propertiesHref}&mandat_actif=1` },
    { label: "Prospects intéressés", value: String(stats.prospectsInterested) },
    { label: "Visites planifiées", value: String(stats.visitsScheduled) },
    { label: "Visites réalisées", value: String(stats.visitsCompleted) },
  ];

  return (
    <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
      <h2 className="font-display text-lg font-semibold text-anthracite-950">Vue d&apos;ensemble</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((tile) =>
          tile.href ? (
            <Link
              key={tile.label}
              href={tile.href}
              className="flex flex-col gap-1 rounded-xl border border-anthracite-100 p-4 transition-colors hover:border-gold-400"
            >
              <span className="text-xs uppercase tracking-wider text-anthracite-400">{tile.label}</span>
              <span className="font-display text-2xl font-semibold text-anthracite-950">{tile.value}</span>
            </Link>
          ) : (
            <div key={tile.label} className="flex flex-col gap-1 rounded-xl border border-anthracite-100 p-4">
              <span className="text-xs uppercase tracking-wider text-anthracite-400">{tile.label}</span>
              <span className="font-display text-2xl font-semibold text-anthracite-950">{tile.value}</span>
            </div>
          )
        )}
      </div>

      {stats.commissionsPrevues !== null && stats.commissionsEncaissees !== null && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1 rounded-xl border border-gold-200 bg-gold-50 p-4">
            <span className="text-xs uppercase tracking-wider text-anthracite-500">Commissions prévues</span>
            <span className="font-display text-2xl font-semibold text-anthracite-950">{madAmount(stats.commissionsPrevues)}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-gold-200 bg-gold-50 p-4">
            <span className="text-xs uppercase tracking-wider text-anthracite-500">Commissions encaissées</span>
            <span className="font-display text-2xl font-semibold text-anthracite-950">{madAmount(stats.commissionsEncaissees)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
