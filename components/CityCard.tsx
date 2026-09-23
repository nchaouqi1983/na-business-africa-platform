import Image from "next/image";
import Link from "next/link";
import EditorialFallback from "@/components/EditorialFallback";
import { cityTaglines } from "@/lib/properties";

type CityCardProps = {
  name: string;
  /** Real number of PUBLIC + PUBLIE biens in the city. */
  count: number;
  /** Public variant URL (card) of a real photo from the city — absent means the light editorial fallback. */
  image?: string;
  sizes?: string;
};

export default function CityCard({
  name,
  count,
  image,
  sizes = "(min-width: 1024px) 400px, 50vw",
}: CityCardProps) {
  return (
    <Link
      href={`/explorer?ville=${encodeURIComponent(name)}`}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-anthracite-100 bg-white shadow-sm transition duration-500 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-anthracite-950/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ivory-100">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <EditorialFallback icon="city" />
        )}
        <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-anthracite-900 shadow-sm">
          {count} bien{count > 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
        <span className="break-words font-display text-lg font-semibold leading-tight text-anthracite-950 sm:text-xl">
          {name}
        </span>
        <p className="line-clamp-3 text-xs leading-relaxed text-anthracite-500 sm:text-sm">
          {cityTaglines[name] ?? "Une sélection de biens premium vous attend."}
        </p>
        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-gold-600">
          Explorer
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
