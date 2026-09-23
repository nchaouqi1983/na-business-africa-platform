import PropertyCard from "@/components/PropertyCard";
import { balancedCardClass } from "@/components/collection-layout";
import type { Property } from "@/lib/properties";
import { getSimilarPublicProperties } from "@/lib/public-catalog/queries";
import { getAgencyPhone } from "@/lib/settings/agency-phone";

export default async function SimilarProperties({ property }: { property: Property }) {
  const [similar, agencyPhone] = await Promise.all([getSimilarPublicProperties(property, 3), getAgencyPhone()]);
  if (similar.length === 0) return null;

  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-2xl font-semibold text-anthracite-950">Biens similaires</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {similar.map((item, index) => (
          <div key={item.id} className={`min-w-0 ${balancedCardClass(index, similar.length)}`}>
            <PropertyCard property={item} agencyPhone={agencyPhone} />
          </div>
        ))}
      </div>
    </section>
  );
}
