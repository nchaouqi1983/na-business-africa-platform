import Link from "next/link";
import Badge from "@/components/Badge";
import { formatPropertyPrice, propertyTypeLabels, type Property } from "@/lib/properties";

type OffMarketPropertyCardProps = {
  property: Property;
};

/**
 * Présentation volontairement sobre : ni quartier, ni adresse, ni tags —
 * seules la ville et les informations déjà publiques dans la fiche sont reprises.
 */
export default function OffMarketPropertyCard({ property }: OffMarketPropertyCardProps) {
  return (
    <Link
      href={`/biens/${property.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-anthracite-100 bg-white transition-shadow duration-300 hover:shadow-xl"
    >
      <div
        className={`relative flex h-40 flex-col justify-between bg-gradient-to-br p-5 ${property.media.placeholderGradient}`}
      >
        <div className="flex items-center justify-between">
          <Badge tone="gold">Off Market</Badge>
          <Badge tone="outline" className="border-white/30 text-white">
            {propertyTypeLabels[property.type]}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-lg font-semibold text-anthracite-950">{property.title.fr}</h3>
          <p className="text-sm text-anthracite-500">{property.location.city}, Maroc</p>
        </div>

        <p className="text-sm leading-relaxed text-anthracite-500">{property.description.fr}</p>

        <div className="mt-auto flex items-center justify-between border-t border-anthracite-100 pt-4">
          <span className="font-display text-base font-semibold text-anthracite-950">
            {formatPropertyPrice(property)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-gold-600 transition-transform group-hover:translate-x-0.5">
            Découvrir le dossier →
          </span>
        </div>
      </div>
    </Link>
  );
}
