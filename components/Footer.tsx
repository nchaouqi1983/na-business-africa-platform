import Link from "next/link";
import { getCities } from "@/lib/properties";

const columns = [
  {
    title: "Plateforme",
    links: [
      { href: "/explorer", label: "Explorer les biens" },
      { href: "/acheter", label: "Acheter" },
      { href: "/vendre", label: "Vendre" },
      { href: "/investir", label: "Investir" },
      { href: "/off-market", label: "Off-market" },
    ],
  },
  {
    title: "Agence",
    links: [
      { href: "/a-propos", label: "À propos" },
      { href: "/villes", label: "Nos villes" },
      { href: "/contact", label: "Contact" },
      { href: "/admin", label: "Espace admin" },
    ],
  },
];

export default function Footer() {
  const cities = getCities();

  return (
    <footer className="border-t border-anthracite-800 bg-anthracite-950 text-anthracite-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-4 lg:px-8">
        <div className="flex flex-col gap-4 lg:col-span-1">
          <span className="font-display text-xl font-semibold text-white">
            NA Business Africa
          </span>
          <p className="text-sm leading-relaxed text-anthracite-400">
            Plateforme immobilière premium dédiée aux biens d&apos;exception et aux opportunités
            off-market à travers le Maroc.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">
              {column.title}
            </span>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-anthracite-300 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">
            Villes couvertes
          </span>
          <ul className="flex flex-wrap gap-2 text-sm text-anthracite-300">
            {cities.map((city, index) => (
              <li key={city.name}>
                {city.name}
                {index < cities.length - 1 ? "," : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-anthracite-800 px-6 py-6 text-xs text-anthracite-500 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
          <span>© {new Date().getFullYear()} NA Business Africa. Tous droits réservés.</span>
          <span>Socle frontend — phase 1</span>
        </div>
      </div>
    </footer>
  );
}
