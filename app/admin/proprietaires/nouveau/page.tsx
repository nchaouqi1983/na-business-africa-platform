import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import { createOwner } from "@/lib/real-estate-network/owner-actions";
import OwnerForm from "../_components/OwnerForm";

export const metadata: Metadata = {
  title: "Ajouter un propriétaire | NA Business Africa",
};

export default async function NewOwnerPage() {
  const user = await requireAdminUser();

  if (!canManageRealEstateNetwork(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas de créer de propriétaire.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Nouveau propriétaire</span>
        <h1 className="font-display text-3xl font-semibold text-anthracite-950">Ajouter un propriétaire</h1>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <OwnerForm action={createOwner} submitLabel="Créer le propriétaire" />
      </div>
    </div>
  );
}
