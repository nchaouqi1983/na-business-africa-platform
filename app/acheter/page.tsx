import type { Metadata } from "next";
import Button from "@/components/Button";
import SectionTitle from "@/components/SectionTitle";
import PropertyCard from "@/components/PropertyCard";
import { properties } from "@/lib/properties";

export const metadata: Metadata = {
  title: "Acheter | NA Business Africa",
  description: "Achetez un bien immobilier premium au Maroc avec l'accompagnement NA Business Africa.",
};

const steps = [
  {
    title: "Définir votre projet",
    description: "Un conseiller dédié affine avec vous vos critères de ville, budget et usage.",
  },
  {
    title: "Sélection ciblée",
    description: "Nous vous proposons des biens correspondants, y compris hors marché.",
  },
  {
    title: "Visites accompagnées",
    description: "Visites organisées et analysées avec un expert local à vos côtés.",
  },
  {
    title: "Sécurisation & signature",
    description: "Négociation, due diligence et suivi jusqu'à la signature notariée.",
  },
];

export default function AcheterPage() {
  const selection = properties.filter((property) => property.commercialStatus !== "off-market").slice(0, 3);

  return (
    <div className="flex flex-col">
      <section className="bg-anthracite-950 py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 lg:px-8">
          <SectionTitle
            eyebrow="Acheter"
            title="Acquérir un bien d'exception en toute confiance"
            description="De la recherche à la signature, notre équipe vous accompagne pour sécuriser votre acquisition au Maroc."
            tone="dark"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/explorer" size="lg">
              Voir les biens disponibles
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Parler à un conseiller
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-20 lg:px-8">
        <SectionTitle eyebrow="Notre méthode" title="Un parcours d'achat structuré en 4 étapes" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="flex flex-col gap-3 rounded-2xl border border-anthracite-100 p-6">
              <span className="font-display text-2xl font-semibold text-gold-600">
                0{index + 1}
              </span>
              <h3 className="font-display text-base font-semibold text-anthracite-950">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-anthracite-500">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-anthracite-50 py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <SectionTitle eyebrow="Sélection" title="Des biens disponibles à l'achat" />
            <Button href="/explorer" variant="secondary">
              Voir tous les biens
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {selection.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
