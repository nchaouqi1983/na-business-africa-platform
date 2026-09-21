import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import VendreHero from "./_components/VendreHero";
import VendreWhyUs from "./_components/VendreWhyUs";
import VendreMethod from "./_components/VendreMethod";
import VendreEstimationForm from "./_components/VendreEstimationForm";
import VendreOffMarketBlock from "./_components/VendreOffMarketBlock";
import VendreFaq from "./_components/VendreFaq";

export const metadata: Metadata = {
  title: "Vendre un bien immobilier au Maroc | NA Business Africa",
  description:
    "Vendez votre bien immobilier à Marrakech, Casablanca ou ailleurs au Maroc avec l'accompagnement personnel de Niama : estimation, présentation premium, sélection des acquéreurs et vente confidentielle possible.",
};

export default function VendrePage() {
  return (
    <div className="flex flex-col">
      <VendreHero />

      {/* POURQUOI CONFIER SON BIEN */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <Reveal>
          <SectionTitle
            eyebrow="Pourquoi Niama"
            title="Pourquoi confier la vente de votre bien à Niama"
            description="Un accompagnement exigeant, pensé pour valoriser votre bien et protéger vos intérêts jusqu'à la signature."
          />
        </Reveal>
        <div className="mt-10">
          <VendreWhyUs />
        </div>
      </section>

      {/* METHODE */}
      <section className="border-y border-anthracite-100 bg-anthracite-50 py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <Reveal>
            <SectionTitle
              eyebrow="La méthode"
              title="Notre méthode de commercialisation"
              description="Cinq étapes claires, de la première rencontre à la finalisation de la vente."
            />
          </Reveal>
          <div className="mt-12">
            <VendreMethod />
          </div>
        </div>
      </section>

      {/* FORMULAIRE */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <Reveal>
            <VendreEstimationForm />
          </Reveal>
        </div>
      </section>

      {/* OFF MARKET */}
      <section className="pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <VendreOffMarketBlock />
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-anthracite-100 bg-anthracite-50 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <Reveal>
            <SectionTitle eyebrow="Questions fréquentes" title="Ce que les propriétaires nous demandent" align="left" />
          </Reveal>
          <div className="mt-10">
            <VendreFaq />
          </div>
        </div>
      </section>
    </div>
  );
}
