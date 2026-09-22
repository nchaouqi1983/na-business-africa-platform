import type { Metadata } from "next";
import Link from "next/link";
import SectionTitle from "@/components/SectionTitle";
import { cityTaglines } from "@/lib/properties";
import { getPublicCityCounts } from "@/lib/public-catalog/queries";

export const metadata: Metadata = {
  title: "Villes | NA Business Africa",
  description: "Découvrez les villes couvertes par NA Business Africa pour vos projets immobiliers.",
};

export default async function VillesPage() {
  const cities = await getPublicCityCounts();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 lg:px-8">
      <SectionTitle
        eyebrow="Villes"
        title="Nos villes de prédilection"
        description="Nous concentrons notre expertise sur les marchés les plus porteurs du Maroc."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <Link
            key={city.name}
            href={`/explorer?ville=${encodeURIComponent(city.name)}`}
            className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-anthracite-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
          >
            <div className="flex h-32 flex-col justify-end bg-gradient-to-br from-anthracite-900 via-anthracite-800 to-anthracite-950 p-5">
              <span className="font-display text-xl font-semibold text-white">{city.name}</span>
            </div>
            <div className="flex flex-col gap-3 p-6">
              <p className="text-sm leading-relaxed text-anthracite-500">
                {cityTaglines[city.name] ?? "Une sélection de biens premium vous attend."}
              </p>
              <span className="text-xs font-semibold uppercase tracking-wider text-gold-600 group-hover:underline">
                {city.count} bien(s) disponible(s) →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
