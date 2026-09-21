import Badge from "@/components/Badge";
import ShareSaveActions from "@/components/property/ShareSaveActions";
import {
  commercialStatusLabels,
  formatPrice,
  formatPropertyPrice,
  type Property,
} from "@/lib/properties";

type PropertyHeaderProps = {
  property: Property;
  discreet: boolean;
};

function transactionBadgeLabel(property: Property): string {
  if (property.visibility.isOffMarket) return "Off-market";
  switch (property.transaction) {
    case "vente":
      return "À vendre";
    case "location":
    case "location-saisonniere":
      return "À louer";
    case "programme-neuf":
      return "Programme neuf";
    default:
      return "À vendre";
  }
}

export default function PropertyHeader({ property, discreet }: PropertyHeaderProps) {
  const locationLabel = discreet
    ? property.location.city
    : property.location.district
      ? `${property.location.district}, ${property.location.city}`
      : property.location.city;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={property.visibility.isOffMarket ? "anthracite" : "gold"}>
          {transactionBadgeLabel(property)}
        </Badge>
        <Badge tone="outline">{commercialStatusLabels[property.commercialStatus]}</Badge>
        {property.visibility.isExclusive && <Badge tone="outline">Exclusivité</Badge>}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-semibold leading-tight text-anthracite-950 sm:text-4xl">
            {property.title.fr}
          </h1>
          <p className="text-sm text-anthracite-500">
            Réf. {property.reference} · {locationLabel}, Maroc
          </p>
        </div>
        <div className="shrink-0 pt-1">
          <ShareSaveActions propertyId={property.id} title={property.title.fr} />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-8 gap-y-2 border-t border-anthracite-100 pt-5">
        <span className="font-display text-3xl font-semibold text-anthracite-950">
          {formatPropertyPrice(property)}
        </span>
        {property.price.pricePerSqm !== undefined && (
          <span className="text-sm text-anthracite-500">
            {formatPrice(property.price.pricePerSqm)}/m²
          </span>
        )}
      </div>
    </div>
  );
}
