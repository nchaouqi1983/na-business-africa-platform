import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import { getOwnerWithProperties } from "@/lib/real-estate-network/owner-queries";
import { updateOwner, setOwnerActive } from "@/lib/real-estate-network/owner-actions";
import { propertyOwnerRoleLabels } from "@/lib/real-estate-network/enum-labels";
import { propertyStatusFromDb, propertyStatusLabels, publicationStatusLabels } from "@/lib/admin/property-enum-maps";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import OwnerForm from "../_components/OwnerForm";

export const metadata: Metadata = {
  title: "Propriétaire | NA Business Africa",
};

const errorMessages: Record<string, string> = {
  permission: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
};

export default async function OwnerDetailPage({ params, searchParams }: PageProps<"/admin/proprietaires/[id]">) {
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
  const owner = await getOwnerWithProperties(id);
  if (!owner) notFound();

  const errorParam = typeof sp.erreur === "string" ? sp.erreur : undefined;
  const errorMessage = errorParam ? errorMessages[errorParam] : undefined;

  const boundUpdate = updateOwner.bind(null, owner.id);
  const boundActivate = setOwnerActive.bind(null, owner.id, true);
  const boundDeactivate = setOwnerActive.bind(null, owner.id, false);

  return (
    <div className="flex flex-col gap-8">
      {errorMessage && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Propriétaire</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">{owner.fullNameOrCompany}</h1>
          <Badge tone={owner.isActive ? "gold" : "anthracite"}>{owner.isActive ? "Actif" : "Inactif"}</Badge>
        </div>
        <form action={owner.isActive ? boundDeactivate : boundActivate}>
          <Button type="submit" variant={owner.isActive ? "ghost" : "primary"} size="sm" className={owner.isActive ? "border border-anthracite-200 hover:border-gold-500" : ""}>
            {owner.isActive ? "Désactiver" : "Activer"}
          </Button>
        </form>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Coordonnées</h2>
        <div className="mt-6">
          <OwnerForm
            action={boundUpdate}
            submitLabel="Enregistrer les modifications"
            defaultValues={{
              kind: owner.kind,
              fullNameOrCompany: owner.fullNameOrCompany,
              cinOrIce: owner.cinOrIce ?? undefined,
              phone: owner.phone ?? undefined,
              email: owner.email ?? undefined,
              address: owner.address ?? undefined,
              city: owner.city ?? undefined,
              contactPreference: owner.contactPreference ?? undefined,
              internalNotes: owner.internalNotes ?? undefined,
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">
          Biens rattachés ({owner.propertyLinks.length})
        </h2>
        {owner.propertyLinks.length === 0 ? (
          <p className="mt-4 text-sm text-anthracite-400">Aucun bien rattaché pour le moment.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {owner.propertyLinks.map((link) => (
              <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-anthracite-900">{link.property.titleFr}</span>
                  <span className="text-xs text-anthracite-400">
                    {link.property.reference} · {link.property.city} · {propertyOwnerRoleLabels[link.role]}
                    {link.quoteShare ? ` · ${link.quoteShare}%` : ""}
                    {link.isMainContact ? " · Contact principal" : ""}
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
