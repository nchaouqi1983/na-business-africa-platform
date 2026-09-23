import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageFinance } from "@/lib/finance/permissions";
import { createCommissionCase } from "@/lib/finance/commission-actions";
import { getPropertyForCommissionAccess, listMandatesForPropertyPicker } from "@/lib/finance/commission-queries";
import { mandateTypeLabels } from "@/lib/finance/enum-labels";
import CommissionCaseForm from "../_components/CommissionCaseForm";

export const metadata: Metadata = {
  title: "Nouveau dossier de commission | NA Business Africa",
};

export default async function NewCommissionCasePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAdminUser();

  if (!canManageFinance(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas de créer de dossier de commission.</p>
      </div>
    );
  }

  const sp = await searchParams;
  const propertyId = typeof sp.propertyId === "string" ? sp.propertyId : undefined;
  const mandateId = typeof sp.mandateId === "string" ? sp.mandateId : undefined;
  const opportunityId = typeof sp.opportunityId === "string" ? sp.opportunityId : undefined;

  if (!propertyId) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Bien requis</h1>
        <p className="text-sm text-anthracite-500">
          Un dossier de commission se crée depuis le dossier d&apos;un bien ou depuis un mandat.
        </p>
      </div>
    );
  }

  const property = await getPropertyForCommissionAccess(propertyId);
  if (!property) notFound();

  const mandates = await listMandatesForPropertyPicker(propertyId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Nouveau dossier de commission</span>
        <h1 className="font-display text-3xl font-semibold text-anthracite-950">{property.titleFr}</h1>
        <p className="text-sm text-anthracite-500">{property.reference}</p>
        {opportunityId && <p className="text-sm text-anthracite-500">Ce dossier sera lié à l&apos;opportunité d&apos;origine.</p>}
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <CommissionCaseForm
          action={createCommissionCase.bind(null, propertyId)}
          submitLabel="Créer le dossier"
          pickerMandates={mandates.map((mandate) => ({ id: mandate.id, label: `${mandate.reference} — ${mandateTypeLabels[mandate.type]}` }))}
          defaultValues={mandateId ? { mandateId } : undefined}
          opportunityId={opportunityId}
        />
      </div>
    </div>
  );
}
