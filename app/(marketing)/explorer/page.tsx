import type { Metadata } from "next";
import Breadcrumb from "@/components/property/Breadcrumb";
import Button from "@/components/Button";
import PropertyCard from "@/components/PropertyCard";
import ExplorerFilterBar from "./_components/ExplorerFilterBar";
import Pagination from "./_components/Pagination";
import { parseFilterStateFromSearchParams, getExplorerPage, serializeFilterState } from "@/lib/public-catalog/filters";
import { searchPublicProperties, getPublicCityCounts, getPublicDistinctDistricts } from "@/lib/public-catalog/queries";
import { getAgencyPhone } from "@/lib/settings/agency-phone";

export const metadata: Metadata = {
  title: "Explorer les biens | NA Business Africa",
  description: "Parcourez et filtrez l'ensemble des biens immobiliers premium disponibles.",
};

export default async function ExplorerPage({ searchParams }: PageProps<"/explorer">) {
  const resolvedSearchParams = await searchParams;
  const filters = parseFilterStateFromSearchParams(resolvedSearchParams);
  const page = getExplorerPage(resolvedSearchParams);

  const [result, cities, districts, agencyPhone] = await Promise.all([
    searchPublicProperties(filters, page),
    getPublicCityCounts(),
    getPublicDistinctDistricts(),
    getAgencyPhone(),
  ]);

  const queryWithoutPage = serializeFilterState(filters);

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-anthracite-950 py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-anthracite-900 via-anthracite-950 to-anthracite-950" />
        <div className="pointer-events-none absolute -left-24 top-0 h-[380px] w-[380px] rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">
            <span className="h-px w-6 bg-gold-400" aria-hidden="true" />
            Le portefeuille complet
          </span>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.12] text-white sm:text-5xl">
            Explorer l&apos;ensemble de nos biens
          </h1>
          <p className="mt-5 max-w-xl font-display text-lg italic leading-relaxed text-anthracite-200">
            Villas, riads, appartements, terrains et adresses commerciales — sélectionnés avec la même exigence,
            partout au Maroc.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-6 pt-5 lg:px-8">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Explorer" }]} />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10 lg:px-8 lg:py-14">
        <ExplorerFilterBar
          initialState={filters}
          cities={cities.map((city) => city.name)}
          districts={districts}
          resultCount={result.total}
        >
          {result.items.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    agencyPhone={agencyPhone}
                    sizes="(min-width: 1280px) 300px, (min-width: 640px) 50vw, 100vw"
                  />
                ))}
              </div>
              <Pagination page={result.page} pageCount={result.pageCount} queryWithoutPage={queryWithoutPage} />
            </>
          ) : (
            <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-anthracite-200 bg-anthracite-50 px-6 py-20 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/60 text-gold-500">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path strokeLinecap="round" d="m20 20-3.5-3.5" />
                </svg>
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-anthracite-900">
                  Aucun bien ne correspond à cette recherche
                </p>
                <p className="mt-2 text-sm text-anthracite-500">
                  Essayez d&apos;élargir vos critères ou réinitialisez les filtres pour retrouver l&apos;ensemble du
                  portefeuille.
                </p>
              </div>
              <Button variant="primary" href="/explorer">
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </ExplorerFilterBar>
      </div>
    </div>
  );
}
