import type { Metadata } from "next";
import Image from "next/image";
import Button from "@/components/Button";
import CityCard from "@/components/CityCard";
import CollectionTile from "@/components/CollectionTile";
import SectionTitle from "@/components/SectionTitle";
import PropertyCard from "@/components/PropertyCard";
import SearchBar from "@/components/SearchBar";
import Reveal from "@/components/Reveal";
import { balancedCardClass, mosaicTileClass } from "@/components/collection-layout";
import { propertyTypeLabels } from "@/lib/properties";
import { propertyTypeFromDb } from "@/lib/admin/property-enum-maps";
import {
  getFeaturedPublicProperties,
  getPublicCityCounts,
  getDistinctPublicPropertyTypes,
  getPublicCoverMedia,
} from "@/lib/public-catalog/queries";
import { publicMediaVariantUrl } from "@/lib/public-catalog/public-urls";
import { getAgencyPhone } from "@/lib/settings/agency-phone";

export const metadata: Metadata = {
  title: "NA Business Africa — L'immobilier d'exception commence par une relation de confiance",
  description:
    "NA Business Africa est une maison de conseil immobilier premium au Maroc : sélection de biens d'exception, réseau off-market confidentiel et accompagnement personnalisé, ville par ville.",
};

const heroStats = [
  { value: "+1000", label: "Biens" },
  { value: "+500", label: "Transactions" },
  { value: "98%", label: "Satisfaction" },
  { value: "Maroc", label: "Présente partout" },
];

export default async function Home() {
  const [cities, featured, dbTypes, covers, agencyPhone] = await Promise.all([
    getPublicCityCounts(),
    getFeaturedPublicProperties(6),
    getDistinctPublicPropertyTypes(),
    getPublicCoverMedia(),
    getAgencyPhone(),
  ]);

  const categories = dbTypes.map((dbType) => {
    const type = propertyTypeFromDb[dbType];
    return { type, label: propertyTypeLabels[type], mediaId: covers.byType[dbType] };
  });

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative overflow-hidden bg-anthracite-950 pb-28 lg:pb-36">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-anthracite-900 via-anthracite-950 to-anthracite-950" />
        <div className="pointer-events-none absolute -right-24 top-16 h-[420px] w-[420px] rounded-full bg-gold-500/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:pt-24">
          <div className="order-2 flex flex-col gap-6 lg:order-1">
            <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">
              <span className="h-px w-6 bg-gold-400" aria-hidden="true" />
              Maison de conseil immobilier premium
            </span>
            <h1 className="font-display text-4xl font-semibold leading-[1.12] text-white sm:text-5xl lg:text-6xl">
              L&apos;immobilier d&apos;exception commence par une{" "}
              <em className="italic text-gold-400">relation de confiance.</em>
            </h1>
            <p className="max-w-xl font-display text-lg italic leading-relaxed text-anthracite-200">
              Je vous accompagne personnellement dans vos projets immobiliers partout au Maroc, avec
              une approche humaine, discrète et exigeante.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="#biens" variant="secondary" size="lg">
                Explorer les biens
              </Button>
              <Button href="/contact" size="lg">
                Prendre rendez-vous
              </Button>
            </div>
            <dl className="grid grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:grid-cols-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                  <dt className="order-2 text-[10px] uppercase tracking-wider text-anthracite-400">
                    {stat.label}
                  </dt>
                  <dd className="order-1 font-display text-2xl font-semibold text-gold-400">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="hidden items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-anthracite-400 lg:flex">
              <span
                className="h-9 w-px animate-scroll-cue bg-gradient-to-b from-gold-400 to-transparent"
                aria-hidden="true"
              />
              Découvrir
            </div>
          </div>

          <div className="relative order-1 aspect-[16/11] overflow-hidden rounded-sm lg:order-2 lg:aspect-[4/5]">
            <Image
              src="/images/hero-na-business-africa.jpg"
              alt="Consultante NA Business Africa dans un bureau premium avec vue sur la Mosquée Hassan II, à Casablanca"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,162,39,0.18),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-5 border border-white/15" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* SEARCH BAR — carte flottante */}
      <section className="relative z-10 -mt-16 px-6 lg:-mt-20 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-anthracite-100 bg-white/95 p-4 shadow-2xl shadow-anthracite-950/10 backdrop-blur sm:p-6">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-anthracite-500">
              Recherche immobilière
            </span>
            <span className="text-xs text-anthracite-400">
              Ville, type de bien et budget — en un instant.
            </span>
          </div>
          <SearchBar variant="panel" cities={cities.map((city) => city.name)} types={categories.map((category) => category.label)} />
        </div>
      </section>

      {/* RENCONTREZ NIAMA */}
      <section
        id="niama"
        className="mx-auto grid max-w-7xl scroll-mt-28 gap-12 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-8 lg:py-28"
      >
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-anthracite-900 via-anthracite-700 to-gold-500/30" />
            <div className="absolute inset-5 border border-white/10" aria-hidden="true" />
          </div>
        </Reveal>
        <Reveal delay={1} className="flex flex-col gap-5">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
            Rencontrez Niama
          </span>
          <h2 className="max-w-sm font-display text-3xl font-semibold leading-tight text-anthracite-950 sm:text-4xl">
            Votre interlocutrice unique pour tous vos projets immobiliers.
          </h2>
          <p className="max-w-md text-base leading-relaxed text-anthracite-500">
            Chez NA Business Africa, l&apos;immobilier est avant tout une histoire de confiance.
            Chaque projet est unique et mérite une approche personnalisée : je vous accompagne avec
            transparence, discrétion et excellence, de la première rencontre jusqu&apos;à la
            signature.
          </p>
          <p className="font-display text-3xl italic text-anthracite-950">Niama</p>
          <div>
            <Button href="/a-propos" variant="ghost">
              Découvrir notre histoire →
            </Button>
          </div>
        </Reveal>
      </section>

      {/* COLLECTIONS / CATEGORIES */}
      <section className="bg-ivory-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <SectionTitle
              eyebrow="L'univers NA Business Africa"
              title="Nos collections"
              description="Parcourez notre catalogue par type de bien, du terrain constructible au programme neuf."
            />
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:auto-rows-[200px] lg:grid-cols-4">
            {categories.map((category, index) => {
              const isFeature = index === 0;
              return (
                <Reveal
                  key={category.type}
                  delay={(index % 4) as 0 | 1 | 2 | 3}
                  className={`min-w-0 ${mosaicTileClass(index, categories.length)}`}
                >
                  <CollectionTile
                    href={`/explorer?type=${encodeURIComponent(category.label)}`}
                    title={category.label}
                    image={
                      category.mediaId ? publicMediaVariantUrl(category.mediaId, "gallery") : undefined
                    }
                    sizes={isFeature ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                    className="h-44 sm:h-56 lg:h-full"
                  />
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* OFF MARKET TEASER */}
      <section className="relative overflow-hidden bg-anthracite-950 py-24 lg:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(201,162,39,0.18),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
          <Reveal>
            <span className="mb-4 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">
              <span className="h-px w-6 bg-gold-400" aria-hidden="true" />
              Réseau privé
              <span className="h-px w-6 bg-gold-400" aria-hidden="true" />
            </span>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              Les meilleures opportunités ne sont pas visibles par tout le monde.
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-anthracite-300">
              Notre réseau privé permet d&apos;accéder à des biens confidentiels réservés à une
              clientèle qualifiée — jamais publiés, jamais affichés.
            </p>
          </Reveal>
          <Reveal delay={3} className="mt-8 flex justify-center">
            <Button href="/off-market" size="lg">
              Demander un accès privé
            </Button>
          </Reveal>
        </div>
      </section>

      {/* BIENS À LA UNE */}
      <section id="biens" className="mx-auto w-full max-w-7xl scroll-mt-28 px-6 py-20 lg:px-8 lg:py-28">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <SectionTitle
              eyebrow="Sélection"
              title="Biens à la une"
              description="Une sélection de biens représentatifs de notre exigence en matière de qualité et d'emplacement."
            />
            <Button href="/explorer" variant="ghost">
              Voir tous les biens →
            </Button>
          </div>
        </Reveal>
        <Reveal delay={1} className="mt-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((property, index) => (
              <div key={property.id} className={`min-w-0 ${balancedCardClass(index, featured.length)}`}>
                <PropertyCard property={property} agencyPhone={agencyPhone} />
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* VILLES */}
      <section id="villes" className="scroll-mt-28 border-y border-anthracite-100 bg-ivory-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <SectionTitle
              eyebrow="Partout au Maroc"
              title="Recherchez par ville"
              description="De nouvelles villes s'ajoutent régulièrement au fil de l'expansion de notre réseau."
            />
          </Reveal>
          <Reveal delay={1} className="mt-10">
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
              {cities.map((city) => (
                <CityCard
                  key={city.name}
                  name={city.name}
                  count={city.count}
                  image={covers.byCity[city.name] ? publicMediaVariantUrl(covers.byCity[city.name], "card") : undefined}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CONTACT / RENDEZ-VOUS */}
      <section className="relative overflow-hidden bg-anthracite-950 py-24 text-center lg:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.12),transparent_65%)]" />
        <div className="relative mx-auto max-w-2xl px-6 lg:px-8">
          <Reveal>
            <SectionTitle
              eyebrow="Parlons-en"
              title="Parlons de votre projet immobilier."
              description="Que vous souhaitiez vendre, acheter ou investir, nous vous accompagnons personnellement partout au Maroc."
              tone="dark"
              align="center"
            />
          </Reveal>
          <Reveal delay={1} className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/contact" size="lg">
              Prendre rendez-vous
            </Button>
            <Button href="/vendre" variant="secondary" size="lg">
              Estimer mon bien
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
