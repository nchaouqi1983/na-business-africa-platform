import Badge from "@/components/Badge";
import { formatPrice, type Property } from "@/lib/properties";

type PropertyCardProps = {
  property: Property;
};

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <article
      id={property.slug}
      className="group flex flex-col overflow-hidden rounded-2xl border border-anthracite-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl"
    >
      <div
        className={`relative flex h-56 flex-col justify-between bg-gradient-to-br p-5 ${property.gradient}`}
      >
        <div className="flex items-center justify-between">
          {property.badge ? <Badge tone="gold">{property.badge}</Badge> : <span />}
          <Badge tone="outline" className="border-white/30 text-white">
            {property.type}
          </Badge>
        </div>
        <p className="font-display text-sm uppercase tracking-[0.3em] text-white/70">
          {property.city}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-lg font-semibold text-anthracite-950">
            {property.title}
          </h3>
          <p className="text-sm text-anthracite-500">{property.city}, Maroc</p>
        </div>

        <p className="text-sm leading-relaxed text-anthracite-500">{property.description}</p>

        <div className="flex items-center gap-4 border-y border-anthracite-100 py-3 text-xs text-anthracite-500">
          <span>{property.surface} m²</span>
          <span aria-hidden="true">·</span>
          <span>{property.bedrooms} ch.</span>
          <span aria-hidden="true">·</span>
          <span>{property.bathrooms} sdb.</span>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-anthracite-950">
            {formatPrice(property.price, property.currency)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-400">
            {property.status}
          </span>
        </div>
      </div>
    </article>
  );
}
