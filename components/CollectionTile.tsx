import Image from "next/image";
import Link from "next/link";
import EditorialFallback from "@/components/EditorialFallback";

type CollectionTileProps = {
  href: string;
  title: string;
  /** Small gold line under the title (e.g. "12 biens"). */
  meta?: string;
  description?: string;
  /** Public variant URL (card/gallery) of a real photo — absent means the light editorial fallback. */
  image?: string;
  sizes: string;
  fallbackIcon?: "home" | "city";
  cta?: string;
  className?: string;
};

/**
 * Photo tile for the category mosaic and city grids. The label sits on a
 * white caption plate instead of a dark veil over the photo, so the image
 * stays bright and the text stays readable whatever the picture.
 */
export default function CollectionTile({
  href,
  title,
  meta,
  description,
  image,
  sizes,
  fallbackIcon = "home",
  cta = "Explorer",
  className = "",
}: CollectionTileProps) {
  return (
    <Link
      href={href}
      className={`group relative block min-w-0 overflow-hidden rounded-2xl bg-ivory-100 shadow-sm ring-1 ring-anthracite-100 transition duration-500 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-anthracite-950/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
    >
      {image ? (
        <>
          <Image
            src={image}
            alt=""
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-anthracite-950/20 to-transparent" />
        </>
      ) : (
        <EditorialFallback icon={fallbackIcon} className="items-start pt-5" />
      )}

      <div className="absolute inset-x-2.5 bottom-2.5 flex min-w-0 flex-col gap-0.5 rounded-xl bg-white/95 px-3.5 py-2.5 shadow-sm backdrop-blur-sm sm:inset-x-3 sm:bottom-3 sm:px-4 sm:py-3">
        <span className="break-words font-display text-base font-semibold leading-tight text-anthracite-950 sm:text-lg">
          {title}
        </span>
        {meta && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-anthracite-500">{meta}</span>
        )}
        {description && <span className="line-clamp-2 text-xs leading-snug text-anthracite-500">{description}</span>}
        <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-gold-600">
          {cta}
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
