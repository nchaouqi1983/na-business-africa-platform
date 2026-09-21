import { Suspense } from "react";
import type { Metadata } from "next";
import SectionTitle from "@/components/SectionTitle";
import ExplorerResults from "./_components/ExplorerResults";

export const metadata: Metadata = {
  title: "Explorer les biens | NA Business Africa",
  description: "Parcourez et filtrez l'ensemble des biens immobiliers premium disponibles.",
};

export default function ExplorerPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 lg:px-8">
      <SectionTitle
        eyebrow="Explorer"
        title="Tous nos biens d'exception"
        description="Filtrez par ville, type de bien et budget pour trouver l'opportunité qui vous correspond."
      />
      <Suspense fallback={<p className="text-sm text-anthracite-500">Chargement des biens…</p>}>
        <ExplorerResults />
      </Suspense>
    </div>
  );
}
