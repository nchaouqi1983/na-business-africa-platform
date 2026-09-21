import type { Metadata } from "next";
import Breadcrumb from "@/components/property/Breadcrumb";
import Button from "@/components/Button";
import SectionTitle from "@/components/SectionTitle";
import PropertyCard from "@/components/PropertyCard";
import SearchBar from "@/components/SearchBar";
import Reveal from "@/components/Reveal";
import { properties } from "@/lib/properties";
import CategoryGrid from "./_components/CategoryGrid";
import AcquisitionSteps from "./_components/AcquisitionSteps";
import CityGrid from "./_components/CityGrid";

export const metadata: Metadata = {
  title: "Acheter un bien immobilier au Maroc | NA Business Africa",
  description:
    "Trouvez le bien qui vous ressemble au Maroc : villas, riads, appartements, terrains et adresses commerciales, avec l'accompagnement personnel de Niama.",
};

const searchCities = ["Marrakech", "Casablanca", "Tanger", "Rabat", "Agadir", "Essaouira"];
const searchTypes = [
  "Appartement",
  "Villa",
  "Riad",
  "Terrain",
  "Maison",
  "Commerce",
  "Hôtel",
  "Bureau",
  "Programme neuf",
];

export default function AcheterPage() {
  const selection = properties
    .filter((property) => property.transaction === "vente" && property.visibility.isPublic)
    .slice(0, 4);

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="bg-anthracite-50 pb-14 pt-10 lg:pb-20 lg:pt-14">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Acheter" }]} />
          <div className="mt-8 max-w-2xl">
            <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">
              <span className="h-px w-6 bg-gold-500" aria-hidden="true" />
              Acheter
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.12] text-anthracite-950 sm:text-5xl">
              Trouver le bien qui vous ressemble
            </h1>
            <p className="mt-5 max-w-xl font-display text-lg italic leading-relaxed text-anthracite-500">
              Un accompagnement personnel, de la première visite jusqu&apos;à la signature — pour que
              chaque étape de votre acquisition reste sereine, partout au Maroc.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/explorer" size="lg">
                Explorer les biens
              </Button>
              <Button href="/contact" variant="ghost" size="lg">
                Parler de votre projet
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* RECHERCHE RAPIDE */}
      <section className="relative z-10 -mt-8 px-6 lg:-mt-10 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-anthracite-100 bg-white/95 p-4 shadow-2xl shadow-anthracite-950/10 backdrop-blur sm:p-6">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-anthracite-500">
              Recherche rapide
            </span>
            <span className="text-xs text-anthracite-400">
              Ville, type de bien et budget — direction le catalogue complet.
            </span>
          </div>
          <SearchBar variant="panel" cities={searchCities} types={searchTypes} />
        </div>
      </section>

      {/* CATÉGORIES */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <Reveal>
          <SectionTitle
            eyebrow="Catégories"
            title="Un projet d'achat, plusieurs types de biens"
            description="Chaque catégorie ouvre directement sur le catalogue, préfiltré selon votre recherche."
          />
        </Reveal>
        <div className="mt-10">
          <CategoryGrid />
        </div>
      </section>

      {/* SÉLECTION DE BIENS À VENDRE */}
      <section className="bg-anthracite-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <SectionTitle
                eyebrow="À découvrir"
                title="Quelques biens actuellement disponibles à l'achat"
              />
              <Button href="/explorer" variant="ghost">
                Voir tous les biens à acheter →
              </Button>
            </div>
          </Reveal>
          {selection.length > 0 ? (
            <Reveal delay={1} className="mt-10">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {selection.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* MÉTHODE NIAMA */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <Reveal>
          <SectionTitle
            eyebrow="Notre méthode"
            title="Votre parcours d'acquisition, étape par étape"
            description="Un accompagnement discret et exigeant, du premier échange jusqu'à la signature."
          />
        </Reveal>
        <div className="mt-10">
          <AcquisitionSteps />
        </div>
      </section>

      {/* VILLES */}
      <section className="border-y border-anthracite-100 bg-anthracite-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <SectionTitle
              eyebrow="Partout au Maroc"
              title="Achetez dans la ville de votre choix"
              description="Marrakech et Casablanca en tête, et l'ensemble des villes où nous sommes présents."
            />
          </Reveal>
          <div className="mt-10">
            <CityGrid />
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden bg-anthracite-950 py-24 text-center lg:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.12),transparent_65%)]" />
        <div className="relative mx-auto max-w-2xl px-6 lg:px-8">
          <Reveal>
            <SectionTitle
              eyebrow="Parlons-en"
              title="Prêt à trouver votre prochain bien ?"
              description="Un premier échange avec Niama, en toute confidentialité et sans engagement, pour poser les bases de votre recherche."
              tone="dark"
              align="center"
            />
          </Reveal>
          <Reveal delay={1} className="mt-8 flex justify-center">
            <Button href="/contact" size="lg">
              Prendre rendez-vous
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
