import PropertyCard from "@/components/PropertyCard";
import type { Property } from "@/lib/properties";
import { getSimilarPublicProperties } from "@/lib/public-catalog/queries";

export default async function SimilarProperties({ property }: { property: Property }) {
  const similar = await getSimilarPublicProperties(property, 3);
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
