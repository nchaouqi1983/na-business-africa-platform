import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageFinance } from "@/lib/finance/permissions";
import { createMandate } from "@/lib/finance/mandate-actions";
import { searchPropertiesForPicker } from "@/lib/finance/mandate-queries";
import { searchActiveOwners } from "@/lib/real-estate-network/owner-queries";
import MandateForm from "../_components/MandateForm";

export const metadata: Metadata = {
  title: "Nouveau mandat | NA Business Africa",
};

export default async function NewMandatePage() {
  const user = await requireAdminUser();

  if (!canManageFinance(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas de créer de mandat.</p>
      </div>
    );
  }

  const [properties, owners] = await Promise.all([searchPropertiesForPicker(), searchActiveOwners()]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Nouveau mandat</span>
        <h1 className="font-display text-3xl font-semibold text-anthracite-950">Ajouter un mandat</h1>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <MandateForm
          action={createMandate}
          submitLabel="Créer le mandat"
          pickerOwners={owners.map((owner) => ({ id: owner.id, label: owner.fullNameOrCompany }))}
          pickerProperties={properties.map((property) => ({ id: property.id, label: `${property.titleFr} — ${property.reference}` }))}
        />
      </div>
    </div>
  );
}
