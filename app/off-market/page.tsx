import type { Metadata } from "next";
import Breadcrumb from "@/components/property/Breadcrumb";
import Button from "@/components/Button";
import SectionTitle from "@/components/SectionTitle";
import Reveal from "@/components/Reveal";
import { properties } from "@/lib/properties";
import OffMarketValues from "./_components/OffMarketValues";
import OffMarketSelection from "./_components/OffMarketSelection";
import OffMarketProcess from "./_components/OffMarketProcess";
import OffMarketRequestForm from "./_components/OffMarketRequestForm";

export const metadata: Metadata = {
  title: "Off-market au Maroc | Portefeuille confidentiel — NA Business Africa",
  description:
    "Accédez à une sélection confidentielle de biens immobiliers hors marché au Maroc : villas, riads et opportunités rares présentées uniquement aux profils qualifiés, avec l'accompagnement personnel de Niama.",
};

export default function OffMarketPage() {
  const offMarketProperties = properties.filter((property) => property.visibility.isOffMarket === true);

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="bg-anthracite-950 pb-16 pt-10 lg:pb-24 lg:pt-14">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Off-market" }]} tone="dark" />
          <div className="mt-8 max-w-2xl">
            <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-500">
              <span className="h-px w-6 bg-gold-500" aria-hidden="true" />
              Sélection confidentielle
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.12] text-white sm:text-5xl">
              Des opportunités jamais publiées
            </h1>
            <p className="mt-5 max-w-xl font-display text-lg italic leading-relaxed text-anthracite-200">
              Certains biens ne sont présentés qu&apos;après avoir compris votre projet et validé votre profil.
              Aucune annonce, aucune vitrine — un accès personnel, réservé aux acquéreurs qualifiés.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="#demande" size="lg">
                Faire une demande confidentielle
              </Button>
              <Button href="/contact" variant="secondary" size="lg">
                Parler à Niama
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* VALEUR DE L'OFF-MARKET */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <Reveal>
          <SectionTitle
            eyebrow="Pourquoi l'off-market"
            title="Un accès différent, pensé pour la discrétion"
            description="Ce que le off-market apporte à un acquéreur qui préfère la confidentialité aux annonces publiques."
          />
        </Reveal>
        <div className="mt-10">
          <OffMarketValues />
        </div>
      </section>

      {/* SÉLECTION */}
      <section className="border-y border-anthracite-100 bg-anthracite-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <SectionTitle
              eyebrow="Sélection actuelle"
              title="Quelques dossiers du portefeuille confidentiel"
              description="Un aperçu restreint de ce qui circule actuellement. D'autres opportunités existent sans jamais être affichées."
            />
          </Reveal>
          <div className="mt-10">
            <OffMarketSelection properties={offMarketProperties} />
          </div>
        </div>
      </section>

      {/* PROCESSUS */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <Reveal>
          <SectionTitle
            eyebrow="Notre méthode"
            title="Un parcours simple, une confidentialité totale"
            description="Quatre étapes, discrètes et exigeantes, du premier échange à la visite."
          />
        </Reveal>
        <div className="mt-10">
          <OffMarketProcess />
        </div>
      </section>

      {/* FORMULAIRE */}
      <section className="border-t border-anthracite-100 bg-anthracite-50 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <Reveal>
            <OffMarketRequestForm />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
