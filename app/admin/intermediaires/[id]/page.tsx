import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import { canManageFinance } from "@/lib/finance/permissions";
import { getIntermediaryWithProperties, getIntermediaryStats } from "@/lib/real-estate-network/intermediary-queries";
import { updateIntermediary, setIntermediaryActive } from "@/lib/real-estate-network/intermediary-actions";
import { intermediaryTypeLabels } from "@/lib/real-estate-network/enum-labels";
import { propertyStatusFromDb, propertyStatusLabels, publicationStatusLabels } from "@/lib/admin/property-enum-maps";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import IntermediaryForm from "../_components/IntermediaryForm";
import NetworkEntityStats from "../../_components/NetworkEntityStats";

export const metadata: Metadata = {
  title: "Intermédiaire | NA Business Africa",
};

const errorMessages: Record<string, string> = {
  permission: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
};

export default async function IntermediaryDetailPage({ params, searchParams }: PageProps<"/admin/intermediaires/[id]">) {
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
  const intermediary = await getIntermediaryWithProperties(id);
  if (!intermediary) notFound();

  const stats = await getIntermediaryStats(intermediary.id, canManageFinance(user.role));

  const errorParam = typeof sp.erreur === "string" ? sp.erreur : undefined;
  const errorMessage = errorParam ? errorMessages[errorParam] : undefined;

  const boundUpdate = updateIntermediary.bind(null, intermediary.id);
  const boundActivate = setIntermediaryActive.bind(null, intermediary.id, true);
  const boundDeactivate = setIntermediaryActive.bind(null, intermediary.id, false);

  return (
    <div className="flex flex-col gap-8">
      {errorMessage && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Intermédiaire</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">{intermediary.nameOrCompany}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="outline">{intermediaryTypeLabels[intermediary.type]}</Badge>
            <Badge tone={intermediary.isActive ? "gold" : "anthracite"}>{intermediary.isActive ? "Actif" : "Inactif"}</Badge>
          </div>
        </div>
        <form action={intermediary.isActive ? boundDeactivate : boundActivate}>
          <Button type="submit" variant={intermediary.isActive ? "ghost" : "primary"} size="sm" className={intermediary.isActive ? "border border-anthracite-200 hover:border-gold-500" : ""}>
            {intermediary.isActive ? "Désactiver" : "Activer"}
          </Button>
        </form>
      </div>

      <NetworkEntityStats stats={stats} propertiesHref={`/admin/biens?intermediaire_id=${intermediary.id}`} />

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Coordonnées</h2>
        <div className="mt-6">
          <IntermediaryForm
            action={boundUpdate}
            submitLabel="Enregistrer les modifications"
            defaultValues={{
              kind: intermediary.kind,
              nameOrCompany: intermediary.nameOrCompany,
              phone: intermediary.phone ?? undefined,
              email: intermediary.email ?? undefined,
              type: intermediary.type,
              city: intermediary.city ?? undefined,
              internalNotes: intermediary.internalNotes ?? undefined,
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">
          Biens rattachés ({intermediary.propertyLinks.length})
        </h2>
        {intermediary.propertyLinks.length === 0 ? (
          <p className="mt-4 text-sm text-anthracite-400">Aucun bien rattaché pour le moment.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {intermediary.propertyLinks.map((link) => (
              <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-anthracite-900">{link.property.titleFr}</span>
                  <span className="text-xs text-anthracite-400">
                    {link.property.reference} · {link.property.city}
                    {link.role ? ` · Rôle : ${intermediaryTypeLabels[link.role]}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="outline">{propertyStatusLabels[propertyStatusFromDb[link.property.status]]}</Badge>
                  <Badge tone="outline">{publicationStatusLabels[link.property.publicationStatus]}</Badge>
                  <Link href={`/admin/biens/${link.property.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-500">
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
