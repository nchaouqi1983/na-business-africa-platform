import CollectionTile from "@/components/CollectionTile";
import Reveal from "@/components/Reveal";
import { mosaicTileClass } from "@/components/collection-layout";
import { getPublicCoverMedia, type PublicPropertyRow } from "@/lib/public-catalog/queries";
import { publicMediaVariantUrl } from "@/lib/public-catalog/public-urls";

type Category = {
  label: string;
  description: string;
  typeParam: string;
  /** Prisma property types whose real photos may illustrate the tile, in order of preference. */
  dbTypes: PublicPropertyRow["propertyType"][];
};

const categories: Category[] = [
  {
    label: "Villas & Riads",
    description: "Demeures de caractère, piscines et jardins, en ville ou en médina.",
    typeParam: "Villa",
    dbTypes: ["VILLA", "RIAD", "MAISON"],
  },
  {
    label: "Appartements & Penthouses",
    description: "Standing, vue dégagée et adresses recherchées.",
    typeParam: "Appartement",
    dbTypes: ["APPARTEMENT", "PENTHOUSE", "DUPLEX"],
  },
  {
    label: "Terrains",
    description: "Parcelles constructibles pour un projet sur mesure.",
    typeParam: "Terrain",
    dbTypes: ["TERRAIN"],
  },
  {
    label: "Hôtellerie",
    description: "Maisons d'hôtes et adresses touristiques en exploitation.",
    typeParam: "Maison d'hôtes",
    dbTypes: ["MAISON_HOTES", "HOTEL"],
  },
  {
    label: "Locaux commerciaux & fonds de commerce",
    description: "Emplacements et activités prêtes à reprendre.",
    typeParam: "Commerce",
    dbTypes: ["COMMERCE", "FONDS_DE_COMMERCE", "RESTAURANT"],
  },
  {
    label: "Bureaux & Dépôts",
    description: "Espaces tertiaires et logistiques dans les pôles d'affaires.",
    typeParam: "Bureau",
    dbTypes: ["BUREAU", "DEPOT"],
  },
  {
    label: "Programmes neufs",
    description: "Résidences en cours de livraison, du studio à la villa.",
    typeParam: "Programme neuf",
    dbTypes: ["PROGRAMME_NEUF"],
  },
];

export default async function CategoryGrid() {
  const covers = await getPublicCoverMedia();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-[210px] lg:grid-cols-4">
      {categories.map((category, index) => {
        const mediaId = category.dbTypes.map((type) => covers.byType[type]).find(Boolean);
        const isFeature = index === 0;
        return (
          <Reveal
            key={category.label}
            delay={(index % 4) as 0 | 1 | 2 | 3}
            className={`min-w-0 ${mosaicTileClass(index, categories.length, { mobileSingleColumn: true })}`}
          >
            <CollectionTile
              href={`/explorer?type=${encodeURIComponent(category.typeParam)}`}
              title={category.label}
              description={category.description}
              image={mediaId ? publicMediaVariantUrl(mediaId, "gallery") : undefined}
              sizes={isFeature ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
              className="h-52 sm:h-56 lg:h-full"
            />
          </Reveal>
        );
      })}
    </div>
  );
}
