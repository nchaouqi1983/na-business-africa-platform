import type { Metadata } from "next";
import CityCard from "@/components/CityCard";
import SectionTitle from "@/components/SectionTitle";
import { getPublicCityCounts, getPublicCoverMedia } from "@/lib/public-catalog/queries";
import { publicMediaVariantUrl } from "@/lib/public-catalog/public-urls";

export const metadata: Metadata = {
  title: "Villes | NA Business Africa",
  description: "Découvrez les villes couvertes par NA Business Africa pour vos projets immobiliers.",
};

export default async function VillesPage() {
  const [cities, covers] = await Promise.all([getPublicCityCounts(), getPublicCoverMedia()]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 lg:px-8">
      <SectionTitle
        eyebrow="Villes"
        title="Nos villes de prédilection"
        description="Nous concentrons notre expertise sur les marchés les plus porteurs du Maroc."
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
        {cities.map((city) => {
          const mediaId = covers.byCity[city.name];
          return (
            <CityCard
              key={city.name}
              name={city.name}
              count={city.count}
              image={mediaId ? publicMediaVariantUrl(mediaId, "card") : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
