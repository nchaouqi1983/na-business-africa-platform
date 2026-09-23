import Reveal from "@/components/Reveal";
import type { Property } from "@/lib/properties";
import { getAgencyPhone } from "@/lib/settings/agency-phone";
import OffMarketPropertyCard from "./OffMarketPropertyCard";

type OffMarketSelectionProps = {
  properties: Property[];
};

export default async function OffMarketSelection({ properties }: OffMarketSelectionProps) {
  if (properties.length === 0) {
    return (
      <Reveal className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-anthracite-200 bg-anthracite-50 px-6 py-20 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/60 text-gold-500">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path strokeLinecap="round" d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <div>
          <p className="font-display text-lg font-semibold text-anthracite-900">
            Aucun dossier confidentiel à afficher pour le moment
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-anthracite-500">
            Le portefeuille off-market évolue au fil des mandats reçus par Niama. Faites-nous connaître votre
            recherche : elle sera étudiée dès qu&apos;une opportunité correspondante rejoindra la sélection.
          </p>
        </div>
      </Reveal>
    );
  }

  const agencyPhone = await getAgencyPhone();

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property, index) => (
        <Reveal key={property.id} delay={(index % 4) as 0 | 1 | 2 | 3} className="min-w-0">
          <OffMarketPropertyCard property={property} agencyPhone={agencyPhone} />
        </Reveal>
      ))}
    </div>
  );
}
