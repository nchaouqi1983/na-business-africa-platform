import Link from "next/link";
import BrandLockup from "@/components/Logo";
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
          <BrandLockup tone="dark" />
          <p className="text-sm leading-relaxed text-anthracite-400">
            Maison de conseil immobilier premium. Un accompagnement personnel, discret et exigeant,
            partout au Maroc.
          </p>
          <div className="flex flex-col gap-1 text-sm text-anthracite-300">
            <a href="tel:+212616176871" className="transition-colors hover:text-gold-400">
              +212 6 16 17 68 71
            </a>
            <a
              href="https://wa.me/212616176871"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-gold-400"
            >
              WhatsApp
            </a>
          </div>
          <div className="flex gap-2">
            <a
              href="https://www.instagram.com/nabusinessafrica?igsh=b3J5dDZhMjZrZ2cy"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-anthracite-700 transition-colors hover:border-gold-500 hover:text-gold-400"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.4}>
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" />
              </svg>
            </a>
            <a
              href="https://www.facebook.com/share/1DAkvwo4Y4/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-anthracite-700 transition-colors hover:border-gold-500 hover:text-gold-400"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.4}>
                <path d="M15 4h-2a4 4 0 00-4 4v3H6v4h3v7h4v-7h3l1-4h-4V8a1 1 0 011-1h3z" />
              </svg>
            </a>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Gloria+Office+5eme+Etage+No+35+Bd+Mohamed+Taib+Naciri+Casablanca"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Google Maps"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-anthracite-700 transition-colors hover:border-gold-500 hover:text-gold-400"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.4}>
                <path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.4" />
              </svg>
            </a>
          </div>
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
          <span>Mentions légales · Politique de confidentialité · Conditions générales</span>
        </div>
      </div>
    </footer>
  );
}
