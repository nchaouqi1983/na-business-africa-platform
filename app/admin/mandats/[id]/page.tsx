import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageFinance } from "@/lib/finance/permissions";
import { getMandateById, listMandateDocumentsForProperty } from "@/lib/finance/mandate-queries";
import { updateMandate, setMandateStatus } from "@/lib/finance/mandate-actions";
import { searchActiveOwners } from "@/lib/real-estate-network/owner-queries";
import { mandateTypeLabels, mandateStatusLabels, commissionCaseStatusLabels } from "@/lib/finance/enum-labels";
import { formatPrice, formatDateTime } from "@/lib/admin/format";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import MandateForm from "../_components/MandateForm";

export const metadata: Metadata = {
  title: "Mandat | NA Business Africa",
};

const errorMessages: Record<string, string> = {
  permission: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
};

export default async function MandateDetailPage({ params, searchParams }: PageProps<"/admin/mandats/[id]">) {
  const user = await requireAdminUser();

  if (!canManageFinance(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas d&apos;accéder à ce mandat.</p>
      </div>
    );
  }

  const { id } = await params;
  const sp = await searchParams;
  const mandate = await getMandateById(id);
  if (!mandate) notFound();

  const [owners, documents] = await Promise.all([searchActiveOwners(), listMandateDocumentsForProperty(mandate.propertyId)]);

  const errorParam = typeof sp.erreur === "string" ? sp.erreur : undefined;
  const errorMessage = errorParam ? errorMessages[errorParam] : undefined;

  const boundUpdate = updateMandate.bind(null, mandate.id);

  return (
    <div className="flex flex-col gap-8">
      {errorMessage && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">{mandate.reference}</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">{mandate.property.titleFr}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="outline">{mandateTypeLabels[mandate.type]}</Badge>
            <Badge tone={mandate.status === "ACTIF" ? "gold" : "anthracite"}>{mandateStatusLabels[mandate.status]}</Badge>
            {mandate.isExclusive && <Badge tone="outline">Exclusif</Badge>}
          </div>
          <Link href={`/admin/biens/${mandate.property.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-500">
            Voir le bien ({mandate.property.reference})
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {mandate.status === "BROUILLON" && (
            <form action={setMandateStatus.bind(null, mandate.id, "ACTIF")}>
              <Button type="submit" size="sm">
                Activer
              </Button>
            </form>
          )}
          {mandate.status === "ACTIF" && (
            <form action={setMandateStatus.bind(null, mandate.id, "FINALISE")}>
              <Button type="submit" variant="secondary" size="sm">
                Finaliser
              </Button>
            </form>
          )}
          {(mandate.status === "BROUILLON" || mandate.status === "ACTIF") && (
            <form action={setMandateStatus.bind(null, mandate.id, "RESILIE")}>
              <Button type="submit" variant="ghost" size="sm" className="border border-anthracite-200 hover:border-gold-500">
                Résilier
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-anthracite-100 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Propriétaire" value={mandate.owner?.fullNameOrCompany ?? "—"} />
        <Info label="Prix affiché" value={formatPrice(mandate.displayedPrice, false)} />
        <Info label="Prix net vendeur convenu" value={formatPrice(mandate.agreedNetSellerPrice, false)} />
        <Info label="Créé par" value={mandate.createdBy.name ?? mandate.createdBy.email} />
        <Info label="Créé le" value={formatDateTime(mandate.createdAt)} />
        <Info label="Date de début" value={mandate.startDate ? formatDateTime(mandate.startDate) : "—"} />
        <Info label="Date de fin" value={mandate.endDate ? formatDateTime(mandate.endDate) : "—"} />
        <Info label="Document" value={mandate.document ? mandate.document.title : "—"} />
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Modifier le mandat</h2>
        <div className="mt-6">
          <MandateForm
            action={boundUpdate}
            submitLabel="Enregistrer les modifications"
            pickerOwners={owners.map((owner) => ({ id: owner.id, label: owner.fullNameOrCompany }))}
            pickerDocuments={documents.map((document) => ({ id: document.id, label: document.title }))}
            defaultValues={{
              ownerId: mandate.ownerId ?? undefined,
              type: mandate.type,
              status: mandate.status,
              startDate: mandate.startDate ? mandate.startDate.toISOString().slice(0, 10) : undefined,
              endDate: mandate.endDate ? mandate.endDate.toISOString().slice(0, 10) : undefined,
              isExclusive: mandate.isExclusive,
              displayedPrice: mandate.displayedPrice ? Number(mandate.displayedPrice) : undefined,
              agreedNetSellerPrice: mandate.agreedNetSellerPrice ? Number(mandate.agreedNetSellerPrice) : undefined,
              internalConditions: mandate.internalConditions ?? undefined,
              documentId: mandate.documentId ?? undefined,
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-anthracite-950">
            Dossiers de commission ({mandate.commissionCases.length})
          </h2>
          <Button href={`/admin/commissions/nouveau?propertyId=${mandate.propertyId}&mandateId=${mandate.id}`} variant="secondary" size="sm">
            + Nouveau dossier
          </Button>
        </div>
        {mandate.commissionCases.length === 0 ? (
          <p className="mt-4 text-sm text-anthracite-400">Aucun dossier de commission pour ce mandat.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {mandate.commissionCases.map((commissionCase) => (
              <li key={commissionCase.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
                <span className="text-sm font-medium text-anthracite-900">{commissionCase.reference}</span>
                <Badge tone="outline">{commissionCaseStatusLabels[commissionCase.status]}</Badge>
                <Link href={`/admin/commissions/${commissionCase.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-500">
                  Voir le dossier
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-400">{label}</span>
      <span className="text-sm font-medium text-anthracite-900">{value}</span>
    </div>
  );
}
