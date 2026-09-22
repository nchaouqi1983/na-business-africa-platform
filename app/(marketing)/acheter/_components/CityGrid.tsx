import Link from "next/link";
import Reveal from "@/components/Reveal";
import { cityTaglines } from "@/lib/properties";
import { getPublicCityCounts } from "@/lib/public-catalog/queries";

const priorityOrder = ["Marrakech", "Casablanca"];

export default async function CityGrid() {
  const cities = [...(await getPublicCityCounts())].sort((a, b) => {
    const rankA = priorityOrder.indexOf(a.name);
    const rankB = priorityOrder.indexOf(b.name);
    if (rankA === -1 && rankB === -1) return 0;
    if (rankA === -1) return 1;
    if (rankB === -1) return -1;
    return rankA - rankB;
  });

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cities.map((city, index) => (
        <Reveal key={city.name} delay={(index % 4) as 0 | 1 | 2 | 3}>
          <Link
            href={`/explorer?ville=${encodeURIComponent(city.name)}`}
            className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-anthracite-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
          >
            <div className="flex h-28 flex-col justify-end bg-gradient-to-br from-anthracite-900 via-anthracite-800 to-anthracite-950 p-5">
              <span className="font-display text-xl font-semibold text-white">{city.name}</span>
            </div>
            <div className="flex flex-col gap-3 p-6 pt-0">
              <p className="text-sm leading-relaxed text-anthracite-500">
                {cityTaglines[city.name] ?? "Une sélection de biens premium vous attend."}
              </p>
              <span className="text-xs font-semibold uppercase tracking-wider text-gold-600 group-hover:underline">
                Explorer {city.name} →
              </span>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
