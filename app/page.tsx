import Link from "next/link";
import Button from "@/components/Button";
import SectionTitle from "@/components/SectionTitle";
import PropertyCard from "@/components/PropertyCard";
import SearchBar from "@/components/SearchBar";
import { getCities, properties, propertyTypes } from "@/lib/properties";

const stats = [
  { value: "120+", label: "Biens d'exception" },
  { value: "6", label: "Villes couvertes" },
  { value: "15 ans", label: "D'expertise locale" },
  { value: "100%", label: "Accompagnement dédié" },
];

const services = [
  {
    title: "Acheter",
    description: "Trouvez le bien qui correspond à vos exigences, accompagné à chaque étape.",
    href: "/acheter",
  },
  {
    title: "Vendre",
    description: "Valorisez votre bien auprès d'une clientèle qualifiée et internationale.",
    href: "/vendre",
  },
  {
    title: "Investir",
    description: "Construisez un portefeuille immobilier rentable au Maroc et en Afrique.",
    href: "/investir",
  },
  {
    title: "Off-market",
    description: "Accédez à une sélection confidentielle de biens rares, hors marché.",
    href: "/off-market",
  },
];

export default function Home() {
  const featured = properties.slice(0, 3);
  const cities = getCities();

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-anthracite-950">
        <div className="absolute inset-0 bg-gradient-to-br from-anthracite-900 via-anthracite-950 to-anthracite-950" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-6 py-24 lg:px-8 lg:py-32">
          <div className="flex max-w-2xl flex-col gap-6">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">
              Immobilier premium en Afrique
            </span>
            <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Des biens d&apos;exception, une expertise sans compromis
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-anthracite-200 sm:text-lg">
              NA Business Africa sélectionne et accompagne l&apos;acquisition, la vente et
              l&apos;investissement dans les biens immobiliers les plus prestigieux du Maroc.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/explorer" size="lg">
                Explorer les biens
              </Button>
              <Button href="/off-market" variant="secondary" size="lg">
                Accès off-market
              </Button>
            </div>
          </div>

          <SearchBar
            variant="hero"
            cities={cities.map((city) => city.name)}
            types={propertyTypes}
          />

          <dl className="grid grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <dt className="order-2 text-xs uppercase tracking-wider text-anthracite-300">
                  {stat.label}
                </dt>
                <dd className="order-1 font-display text-3xl font-semibold text-gold-400">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-20 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionTitle
            eyebrow="Sélection"
            title="Biens à la une"
            description="Une sélection de biens représentatifs de notre exigence en matière de qualité et d'emplacement."
          />
          <Button href="/explorer" variant="secondary">
            Voir tous les biens
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      <section className="bg-anthracite-50 py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:px-8">
          <SectionTitle
            eyebrow="Nos services"
            title="Un accompagnement complet, à chaque étape"
            align="center"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <Link
                key={service.href}
                href={service.href}
                className="group flex flex-col gap-3 rounded-2xl border border-anthracite-100 bg-white p-6 transition-shadow hover:shadow-lg"
              >
                <h3 className="font-display text-lg font-semibold text-anthracite-950 group-hover:text-gold-600">
                  {service.title}
                </h3>
                <p className="text-sm leading-relaxed text-anthracite-500">
                  {service.description}
                </p>
                <span className="mt-auto text-xs font-semibold uppercase tracking-wider text-gold-600">
                  Découvrir →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-20 lg:px-8">
        <SectionTitle
          eyebrow="Villes"
          title="Une présence dans les villes stratégiques du Maroc"
          description="Casablanca, Marrakech, Rabat, Tanger, Agadir, Essaouira — découvrez nos opportunités ville par ville."
        />
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {cities.map((city) => (
            <Link
              key={city.name}
              href={`/explorer?ville=${encodeURIComponent(city.name)}`}
              className="flex flex-col gap-1 rounded-xl border border-anthracite-100 bg-white px-4 py-5 text-center transition-colors hover:border-gold-500"
            >
              <span className="font-display text-base font-semibold text-anthracite-950">
                {city.name}
              </span>
              <span className="text-xs text-anthracite-500">{city.count} bien(s)</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-anthracite-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-20 text-center lg:px-8">
          <SectionTitle
            eyebrow="Contact"
            title="Discutons de votre prochain projet immobilier"
            tone="dark"
            align="center"
          />
          <Button href="/contact" size="lg">
            Prendre contact
          </Button>
        </div>
      </section>
    </div>
  );
}
