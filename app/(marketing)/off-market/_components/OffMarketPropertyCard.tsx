import Image from "next/image";
import Link from "next/link";
import EditorialFallback from "@/components/EditorialFallback";
import CardActions from "@/components/property/CardActions";
import { formatPropertyPrice, propertyTypeLabels, type Property } from "@/lib/properties";
import type { AgencyPhone } from "@/lib/settings/agency-phone";

type OffMarketPropertyCardProps = {
  property: Property;
  agencyPhone: AgencyPhone;
};

/**
 * Présentation volontairement sobre : ni quartier, ni adresse, ni tags —
 * seules la ville et les informations déjà publiques dans la fiche sont reprises.
 * Même structure que PropertyCard (photo/titre liés, actions sœurs, aucun lien imbriqué).
 */
export default function OffMarketPropertyCard({ property, agencyPhone }: OffMarketPropertyCardProps) {
  const href = `/biens/${property.slug}`;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-anthracite-100 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-anthracite-950/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="relative block aspect-[4/3] overflow-hidden bg-ivory-100">
        {property.media.coverImage ? (
          <Image
            src={property.media.coverImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <EditorialFallback icon="lock" />
        )}
        <div className="absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-anthracite-900 shadow-sm">
            {propertyTypeLabels[property.type]}
          </span>
          <span className="inline-flex items-center rounded-full bg-gold-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-anthracite-950 shadow-sm">
            Off Market
          </span>
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-600">
          {property.location.city} · Adresse confidentielle
        </p>

        <h3 className="mt-2 line-clamp-2 min-h-[2lh] break-words font-display text-lg font-semibold leading-snug text-anthracite-950">
          <Link href={href} className="transition-colors hover:text-gold-600">
            {property.title.fr}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-3 min-h-[3lh] break-words text-sm leading-relaxed text-anthracite-500">
          {property.description.fr}
        </p>

        <div className="mt-auto flex flex-col gap-4 pt-5">
          <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1 border-t border-anthracite-100 pt-4">
            <span className="font-display text-xl font-semibold text-anthracite-950">{formatPropertyPrice(property)}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-400">Dossier privé</span>
          </div>
          <CardActions href={href} label="Voir le dossier" srContext={property.title.fr} phone={agencyPhone} />
        </div>
      </div>
    </article>
  );
}
