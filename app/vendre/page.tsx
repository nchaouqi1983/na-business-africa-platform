import type { Metadata } from "next";
import Button from "@/components/Button";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "Vendre | NA Business Africa",
  description: "Vendez votre bien immobilier premium avec NA Business Africa et une clientèle qualifiée.",
};

const benefits = [
  {
    title: "Estimation précise",
    description: "Analyse fine du marché local pour positionner votre bien au juste prix.",
  },
  {
    title: "Clientèle qualifiée",
    description: "Diaspora, investisseurs et acquéreurs internationaux déjà identifiés.",
  },
  {
    title: "Discrétion garantie",
    description: "Option de commercialisation off-market pour préserver votre confidentialité.",
  },
  {
    title: "Suivi de bout en bout",
    description: "Un interlocuteur unique, de la mise en marché à la signature.",
  },
];

const steps = [
  { title: "Prise de contact", description: "Échange avec un conseiller pour qualifier votre bien." },
  { title: "Estimation", description: "Analyse comparative et proposition de stratégie de vente." },
  { title: "Mise en marché", description: "Diffusion ciblée, y compris en off-market si souhaité." },
  { title: "Négociation & vente", description: "Sélection des offres et accompagnement jusqu'à la signature." },
];

export default function VendrePage() {
  return (
    <div className="flex flex-col">
      <section className="bg-anthracite-950 py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 lg:px-8">
          <SectionTitle
            eyebrow="Vendre"
            title="Valorisez votre bien auprès des bons acquéreurs"
            description="NA Business Africa positionne votre bien auprès d'une clientèle premium, locale et internationale."
            tone="dark"
          />
          <div>
            <Button href="/contact" size="lg">
              Demander une estimation
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-20 lg:px-8">
        <SectionTitle eyebrow="Pourquoi nous confier votre bien" title="Une commercialisation exigeante et efficace" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex flex-col gap-3 rounded-2xl border border-anthracite-100 p-6">
              <h3 className="font-display text-base font-semibold text-anthracite-950">
                {benefit.title}
              </h3>
              <p className="text-sm leading-relaxed text-anthracite-500">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-anthracite-50 py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:px-8">
          <SectionTitle eyebrow="Processus" title="Vendre en 4 étapes" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm">
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
        </div>
      </section>
    </div>
  );
}
