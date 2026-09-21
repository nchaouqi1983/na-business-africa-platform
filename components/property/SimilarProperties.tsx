import PropertyCard from "@/components/PropertyCard";
import { properties, type Property } from "@/lib/properties";

function getSimilarProperties(current: Property, count: number): Property[] {
  const candidates = properties.filter(
    (property) => property.id !== current.id && property.visibility.isPublic
  );

  const scored = candidates.map((property) => {
    let score = 0;
    if (property.location.city === current.location.city) score += 2;
    if (property.type === current.type) score += 2;
    if (property.transaction === current.transaction) score += 1;
    return { property, score };
  });

  return scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((entry) => entry.property);
}

export default function SimilarProperties({ property }: { property: Property }) {
  const similar = getSimilarProperties(property, 3);
  if (similar.length === 0) return null;

  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-2xl font-semibold text-anthracite-950">Biens similaires</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {similar.map((item) => (
          <PropertyCard key={item.id} property={item} />
        ))}
      </div>
    </section>
  );
}
