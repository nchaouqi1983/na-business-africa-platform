import Link from "next/link";
import Reveal from "@/components/Reveal";

type Category = {
  label: string;
  description: string;
  typeParam: string;
  gradient: string;
};

const categories: Category[] = [
  {
    label: "Villas & Riads",
    description: "Demeures de caractère, piscines et jardins, en ville ou en médina.",
    typeParam: "Villa",
    gradient: "from-anthracite-900 via-anthracite-700 to-gold-500/30",
  },
  {
    label: "Appartements & Penthouses",
    description: "Standing, vue dégagée et adresses recherchées.",
    typeParam: "Appartement",
    gradient: "from-anthracite-950 via-anthracite-800 to-anthracite-600",
  },
  {
    label: "Terrains",
    description: "Parcelles constructibles pour un projet sur mesure.",
    typeParam: "Terrain",
    gradient: "from-anthracite-800 via-gold-600/20 to-anthracite-950",
  },
  {
    label: "Hôtellerie",
    description: "Maisons d'hôtes et adresses touristiques en exploitation.",
    typeParam: "Maison d'hôtes",
    gradient: "from-gold-600/40 via-anthracite-800 to-anthracite-950",
  },
  {
    label: "Locaux commerciaux & fonds de commerce",
    description: "Emplacements et activités prêtes à reprendre.",
    typeParam: "Commerce",
    gradient: "from-anthracite-800 via-anthracite-600 to-gold-400/30",
  },
  {
    label: "Bureaux & Dépôts",
    description: "Espaces tertiaires et logistiques dans les pôles d'affaires.",
    typeParam: "Bureau",
    gradient: "from-anthracite-900 via-gold-600/20 to-anthracite-700",
  },
  {
    label: "Programmes neufs",
    description: "Résidences en cours de livraison, du studio à la villa.",
    typeParam: "Programme neuf",
    gradient: "from-anthracite-900 via-anthracite-700 to-gold-500/30",
  },
];

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((category, index) => (
        <Reveal key={category.label} delay={(index % 4) as 0 | 1 | 2 | 3}>
          <Link
            href={`/explorer?type=${encodeURIComponent(category.typeParam)}`}
            className={`group relative flex h-40 flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br p-5 transition-transform duration-500 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${category.gradient}`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-anthracite-950/80 via-anthracite-950/10 to-transparent" />
            <div className="relative flex flex-col gap-1.5">
              <span className="font-display text-base font-semibold leading-tight text-white">
                {category.label}
              </span>
              <span className="text-xs leading-snug text-anthracite-200">{category.description}</span>
              <span className="mt-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gold-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:opacity-100">
                Explorer →
              </span>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
