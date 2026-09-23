import Image from "next/image";
import Link from "next/link";
import EditorialFallback from "@/components/EditorialFallback";
import CardActions from "@/components/property/CardActions";
import {
  commercialStatusLabels,
  formatPropertyPrice,
  getPrimaryBadge,
  getTagDefinition,
  propertyTypeLabels,
  type Property,
} from "@/lib/properties";
import type { AgencyPhone } from "@/lib/settings/agency-phone";

type PropertyCardProps = {
  property: Property;
  /** Agency phone (OrganizationSettings) — never a bien's owner/intermediary number. */
  agencyPhone: AgencyPhone;
  sizes?: string;
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

function keyFeatures(property: Property): string[] {
  const { livingArea, landArea, bedrooms, bathrooms } = property.layout;
  const features: string[] = [];
  if (livingArea !== undefined) features.push(`${livingArea} m²`);
  else if (landArea !== undefined) features.push(`${landArea} m² terrain`);
  if (bedrooms !== undefined) features.push(`${bedrooms} ch.`);
  if (bathrooms !== undefined) features.push(`${bathrooms} sdb.`);
  return features;
}

/**
 * Public listing card. Not a single wrapping link: the photo and the title
 * each link to the fiche, and the footer holds two sibling actions ("Voir le
 * bien" / "Appeler") — no nested interactive elements.
 */
export default function PropertyCard({
  property,
  agencyPhone,
  sizes = "(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw",
}: PropertyCardProps) {
  const href = `/biens/${property.slug}`;
  const badge = getPrimaryBadge(property);
  const locationLabel = property.location.district
    ? `${property.location.city} · ${property.location.district}`
    : property.location.city;
  const tags = topTags(property, 3);
  const features = keyFeatures(property);
  // A bien published without description would leave a hole before the price.
  const description =
    property.description.fr.trim() ||
    `${propertyTypeLabels[property.type]} à ${property.location.city}. Détails et visite sur demande auprès de l'agence.`;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-anthracite-100 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-anthracite-950/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="relative block aspect-[4/3] overflow-hidden bg-ivory-100">
        {property.media.coverImage ? (
          <Image
            src={property.media.coverImage}
            alt=""
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <EditorialFallback icon="home" />
        )}
        <div className="absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-anthracite-900 shadow-sm">
            {propertyTypeLabels[property.type]}
          </span>
          {badge && (
            <span className="inline-flex items-center rounded-full bg-gold-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-anthracite-950 shadow-sm">
              {badge.label}
            </span>
          )}
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-600">{locationLabel}</p>

        {/* Title and description reserve their clamped height so prices and
            actions line up across a row without a gap before the price. */}
        <h3 className="mt-2 line-clamp-2 min-h-[2lh] break-words font-display text-lg font-semibold leading-snug text-anthracite-950">
          <Link href={href} className="transition-colors hover:text-gold-600">
            {property.title.fr}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-3 min-h-[3lh] break-words text-sm leading-relaxed text-anthracite-500">
          {description}
        </p>

        {features.length > 0 && (
          <ul className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-anthracite-100 pt-3 text-xs font-medium text-anthracite-700">
            {features.map((feature, index) => (
              <li key={feature} className="flex items-center gap-3">
                {index > 0 && (
                  <span className="h-1 w-1 rounded-full bg-gold-400" aria-hidden="true" />
                )}
                {feature}
              </li>
            ))}
          </ul>
        )}

        {tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li
                key={tag}
                className="max-w-full break-words rounded-full bg-ivory-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-anthracite-600"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex flex-col gap-4 pt-5">
          <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
            <span className="font-display text-xl font-semibold text-anthracite-950">{formatPropertyPrice(property)}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-400">
              {commercialStatusLabels[property.commercialStatus]}
            </span>
          </div>
          <CardActions href={href} label="Voir le bien" srContext={property.title.fr} phone={agencyPhone} />
        </div>
      </div>
    </article>
  );
}
