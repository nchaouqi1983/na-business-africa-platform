import Badge from "@/components/Badge";
import {
  commercialStatusLabels,
  formatPropertyPrice,
  getPrimaryBadge,
  propertyTypeLabels,
  type Property,
} from "@/lib/properties";

type PropertyCardProps = {
  property: Property;
};

export default function PropertyCard({ property }: PropertyCardProps) {
  const badge = getPrimaryBadge(property);
  const locationLabel = property.location.district
    ? `${property.location.district}, ${property.location.city}`
    : property.location.city;

  return (
    <article
      id={property.slug}
      className="group flex flex-col overflow-hidden rounded-2xl border border-anthracite-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl"
    >
      <div
        className={`relative flex h-56 flex-col justify-between bg-gradient-to-br p-5 ${property.media.placeholderGradient}`}
      >
        <div className="flex items-center justify-between">
          {badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : <span />}
          <Badge tone="outline" className="border-white/30 text-white">
            {propertyTypeLabels[property.type]}
          </Badge>
        </div>
        <p className="font-display text-sm uppercase tracking-[0.3em] text-white/70">
          {property.location.city}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-lg font-semibold text-anthracite-950">
            {property.title.fr}
          </h3>
          <p className="text-sm text-anthracite-500">{locationLabel}, Maroc</p>
        </div>

        <p className="text-sm leading-relaxed text-anthracite-500">{property.description.fr}</p>

        <div className="flex items-center gap-4 border-y border-anthracite-100 py-3 text-xs text-anthracite-500">
          {property.layout.livingArea !== undefined && <span>{property.layout.livingArea} m²</span>}
          {property.layout.bedrooms !== undefined && (
            <>
              <span aria-hidden="true">·</span>
              <span>{property.layout.bedrooms} ch.</span>
            </>
          )}
          {property.layout.bathrooms !== undefined && (
            <>
              <span aria-hidden="true">·</span>
              <span>{property.layout.bathrooms} sdb.</span>
            </>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-anthracite-950">
            {formatPropertyPrice(property)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-400">
            {commercialStatusLabels[property.commercialStatus]}
          </span>
        </div>
      </div>
    </article>
  );
}
