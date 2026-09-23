import CityCard from "@/components/CityCard";
import Reveal from "@/components/Reveal";
import { getPublicCityCounts, getPublicCoverMedia } from "@/lib/public-catalog/queries";
import { publicMediaVariantUrl } from "@/lib/public-catalog/public-urls";

const priorityOrder = ["Marrakech", "Casablanca"];

export default async function CityGrid() {
  const [cityCounts, covers] = await Promise.all([getPublicCityCounts(), getPublicCoverMedia()]);
  const cities = [...cityCounts].sort((a, b) => {
    const rankA = priorityOrder.indexOf(a.name);
    const rankB = priorityOrder.indexOf(b.name);
    if (rankA === -1 && rankB === -1) return 0;
    if (rankA === -1) return 1;
    if (rankB === -1) return -1;
    return rankA - rankB;
  });

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
      {cities.map((city, index) => {
        const mediaId = covers.byCity[city.name];
        return (
          <Reveal key={city.name} delay={(index % 4) as 0 | 1 | 2 | 3} className="min-w-0">
            <CityCard
              name={city.name}
              count={city.count}
              image={mediaId ? publicMediaVariantUrl(mediaId, "card") : undefined}
            />
          </Reveal>
        );
      })}
    </div>
  );
}
