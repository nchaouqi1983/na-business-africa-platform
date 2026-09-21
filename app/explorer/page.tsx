import { Suspense } from "react";
import type { Metadata } from "next";
import Breadcrumb from "@/components/property/Breadcrumb";
import ExplorerResults from "./_components/ExplorerResults";

export const metadata: Metadata = {
  title: "Explorer les biens | NA Business Africa",
  description: "Parcourez et filtrez l'ensemble des biens immobiliers premium disponibles.",
};

export default function ExplorerPage() {
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
        <Suspense fallback={<p className="text-sm text-anthracite-500">Chargement des biens…</p>}>
          <ExplorerResults />
        </Suspense>
      </div>
    </div>
  );
}
