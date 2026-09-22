import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import { getProgramWithLotsAndProperties } from "@/lib/real-estate-network/program-queries";
import { searchActivePromoters } from "@/lib/real-estate-network/promoter-queries";
import { updateProgram, setProgramActive } from "@/lib/real-estate-network/program-actions";
import { programStatusLabels } from "@/lib/real-estate-network/enum-labels";
import { propertyStatusFromDb, propertyStatusLabels, publicationStatusLabels } from "@/lib/admin/property-enum-maps";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import ProgramForm from "../_components/ProgramForm";
import LotManager from "../_components/LotManager";

export const metadata: Metadata = {
  title: "Programme | NA Business Africa",
};

const errorMessages: Record<string, string> = {
  permission: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
};

export default async function ProgramDetailPage({ params, searchParams }: PageProps<"/admin/programmes/[id]">) {
  const user = await requireAdminUser();

  if (!canManageRealEstateNetwork(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas d&apos;accéder à cette fiche.</p>
      </div>
    );
  }

  const { id } = await params;
  const sp = await searchParams;
  const [program, promoters] = await Promise.all([getProgramWithLotsAndProperties(id), searchActivePromoters()]);
  if (!program) notFound();

  const errorParam = typeof sp.erreur === "string" ? sp.erreur : undefined;
  const errorMessage = errorParam ? errorMessages[errorParam] : undefined;

  const boundUpdate = updateProgram.bind(null, program.id);
  const boundActivate = setProgramActive.bind(null, program.id, true);
  const boundDeactivate = setProgramActive.bind(null, program.id, false);

  return (
    <div className="flex flex-col gap-8">
      {errorMessage && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Programme neuf</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">{program.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="outline">{programStatusLabels[program.status]}</Badge>
            <Badge tone={program.isActive ? "gold" : "anthracite"}>{program.isActive ? "Actif" : "Inactif"}</Badge>
          </div>
        </div>
        <form action={program.isActive ? boundDeactivate : boundActivate}>
          <Button type="submit" variant={program.isActive ? "ghost" : "primary"} size="sm" className={program.isActive ? "border border-anthracite-200 hover:border-gold-500" : ""}>
            {program.isActive ? "Désactiver" : "Activer"}
          </Button>
        </form>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Informations</h2>
        <div className="mt-6">
          <ProgramForm
            action={boundUpdate}
            submitLabel="Enregistrer les modifications"
            initialPromoters={promoters.map((promoter) => ({ id: promoter.id, companyName: promoter.companyName }))}
            defaultValues={{
              promoterId: program.promoterId,
              promoterName: program.promoter.companyName,
              name: program.name,
              city: program.city,
              district: program.district ?? undefined,
              address: program.address ?? undefined,
              latitude: program.latitude ?? undefined,
              longitude: program.longitude ?? undefined,
              internalDescription: program.internalDescription ?? undefined,
              status: program.status,
              expectedDeliveryDate: program.expectedDeliveryDate ? program.expectedDeliveryDate.toISOString().slice(0, 10) : undefined,
              indicativeLotCount: program.indicativeLotCount ?? undefined,
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <LotManager
          programId={program.id}
          lots={program.lots.map((lot) => ({
            id: lot.id,
            reference: lot.reference,
            lotType: lot.lotType,
            typology: lot.typology,
            surface: lot.surface,
            price: lot.price ? Number(lot.price) : null,
            status: lot.status,
            floor: lot.floor,
            block: lot.block,
            extraInfo: lot.extraInfo ? JSON.stringify(lot.extraInfo) : null,
          }))}
        />
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Biens liés ({program.properties.length})</h2>
        {program.properties.length === 0 ? (
          <p className="mt-4 text-sm text-anthracite-400">Aucun bien rattaché à ce programme.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {program.properties.map((property) => (
              <li key={property.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-anthracite-900">{property.titleFr}</span>
                  <span className="text-xs text-anthracite-400">
                    {property.reference}
                    {property.developmentLotId ? ` · Lot ${program.lots.find((lot) => lot.id === property.developmentLotId)?.reference ?? ""}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="outline">{propertyStatusLabels[propertyStatusFromDb[property.status]]}</Badge>
                  <Badge tone="outline">{publicationStatusLabels[property.publicationStatus]}</Badge>
                  <Link href={`/admin/biens/${property.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-500">
                    Voir le bien
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
