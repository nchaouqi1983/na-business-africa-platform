import type { Metadata } from "next";
import Button from "@/components/Button";
import SectionTitle from "@/components/SectionTitle";
import PropertyCard from "@/components/PropertyCard";
import { properties } from "@/lib/properties";

export const metadata: Metadata = {
  title: "Off-market | NA Business Africa",
  description: "Accédez à une sélection confidentielle de biens immobiliers hors marché.",
};

export default function OffMarketPage() {
  const offMarket = properties.filter((property) => property.status === "Off-market");

  return (
    <div className="flex flex-col">
      <section className="bg-anthracite-950 py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 lg:px-8">
          <SectionTitle
            eyebrow="Off-market"
            title="Une sélection confidentielle, réservée à nos clients"
            description="Ces biens ne sont pas diffusés publiquement. Ils sont présentés uniquement aux acquéreurs et investisseurs qualifiés par nos équipes."
            tone="dark"
          />
          <div>
            <Button href="/contact" size="lg">
              Demander un accès
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-20 lg:px-8">
        <SectionTitle
          eyebrow="Sélection actuelle"
          title="Biens hors marché disponibles"
          description="Un aperçu de notre portefeuille confidentiel. Les détails complets sont partagés après confirmation de votre profil."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offMarket.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>
    </div>
  );
}
