import Link from "next/link";
import type { AgencyPhone } from "@/lib/settings/agency-phone";

type CardActionsProps = {
  href: string;
  label: string;
  /** Bien title, appended for screen readers so each "Voir le bien" link is distinct. */
  srContext: string;
  phone: AgencyPhone;
};

/**
 * Primary "see the bien" link + secondary agency call button. Both wrap to
 * full width on a narrow card instead of overflowing it.
 */
export default function CardActions({ href, label, srContext, phone }: CardActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={href}
        className="inline-flex h-11 flex-[1_1_auto] items-center justify-center whitespace-nowrap rounded-full bg-anthracite-950 px-3.5 text-[11px] font-semibold uppercase tracking-wider text-white transition-colors duration-200 hover:bg-gold-500 hover:text-anthracite-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
      >
        {label}
        <span className="sr-only"> : {srContext}</span>
      </Link>
      <a
        href={phone.href}
        aria-label={`Appeler l'agence au ${phone.display}`}
        className="inline-flex h-11 flex-[1_1_auto] items-center justify-center gap-2 whitespace-nowrap rounded-full border border-anthracite-200 bg-white px-3.5 text-[11px] font-semibold uppercase tracking-wider text-anthracite-900 transition-colors duration-200 hover:border-gold-500 hover:text-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 4h3l1.5 4.5-2 1.2a11 11 0 0 0 6.8 6.8l1.2-2L20 16v3a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"
          />
        </svg>
        Appeler
      </a>
    </div>
  );
}
