import Link from "next/link";
import Badge from "@/components/Badge";
import {
  commercialStatusLabels,
  formatPropertyPrice,
  getPrimaryBadge,
  getTagDefinition,
  propertyTypeLabels,
  type Property,
} from "@/lib/properties";

type PropertyCardProps = {
  property: Property;
};

const priorityTagCategories = ["marketing", "vue"] as const;

function topTags(property: Property, count: number): string[] {
  const definitions = property.tags
    .map((slug) => getTagDefinition(slug))
    .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));

  const ranked = [...definitions].sort((a, b) => {
    const rankOf = (tag: NonNullable<typeof a>) => {
      const index = priorityTagCategories.indexOf(tag.category as (typeof priorityTagCategories)[number]);
      return index === -1 ? priorityTagCategories.length : index;
    };
    return rankOf(a) - rankOf(b);
  });

  return ranked.slice(0, count).map((tag) => tag.label.fr);
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const badge = getPrimaryBadge(property);
  const locationLabel = property.location.district
    ? `${property.location.district}, ${property.location.city}`
    : property.location.city;
  const tags = topTags(property, 3);

  return (
    <Link
      href={`/biens/${property.slug}`}
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

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-anthracite-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-anthracite-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-anthracite-950">
            {formatPropertyPrice(property)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-400">
            {commercialStatusLabels[property.commercialStatus]}
          </span>
        </div>
      </div>
    </Link>
  );
}
