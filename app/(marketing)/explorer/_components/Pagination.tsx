import Link from "next/link";

type PaginationProps = {
  page: number;
  pageCount: number;
  /** Current filter query string, without `page` — reused to build prev/next links. */
  queryWithoutPage: string;
};

function hrefForPage(queryWithoutPage: string, page: number): string {
  const params = new URLSearchParams(queryWithoutPage);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/explorer?${query}` : "/explorer";
}

export default function Pagination({ page, pageCount, queryWithoutPage }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-4">
      {page > 1 ? (
        <Link
          href={hrefForPage(queryWithoutPage, page - 1)}
          className="rounded-full border border-anthracite-200 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-anthracite-700 transition-colors hover:border-gold-500 hover:text-gold-600"
        >
          ← Précédent
        </Link>
      ) : (
        <span className="rounded-full border border-anthracite-100 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-anthracite-300">
          ← Précédent
        </span>
      )}

      <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">
        Page {page} / {pageCount}
      </span>

      {page < pageCount ? (
        <Link
          href={hrefForPage(queryWithoutPage, page + 1)}
          className="rounded-full border border-anthracite-200 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-anthracite-700 transition-colors hover:border-gold-500 hover:text-gold-600"
        >
          Suivant →
        </Link>
      ) : (
        <span className="rounded-full border border-anthracite-100 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-anthracite-300">
          Suivant →
        </span>
      )}
    </nav>
  );
}
