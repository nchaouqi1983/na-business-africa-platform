import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/auth/dal";
import { canCreateProperty, canManageTags } from "@/lib/property-permissions";
import { createPropertyDraft } from "@/lib/admin/property-actions";
import { listActiveTags } from "@/lib/admin/property-tags";
import { listAssignableUsers } from "@/lib/admin/property-queries";
import PropertyDossierForm from "../_components/PropertyDossierForm";

export const metadata: Metadata = {
  title: "Ajouter un bien | NA Business Africa",
};

export default async function NewPropertyPage() {
  const user = await requireAdminUser();

  if (!canCreateProperty(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas de créer de nouveaux biens.</p>
      </div>
    );
  }

  const canAssign = canManageTags(user.role);
  const [allTags, assignableUsers] = await Promise.all([
    listActiveTags(),
    canAssign ? listAssignableUsers() : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Nouveau dossier</span>
        <h1 className="font-display text-3xl font-semibold text-anthracite-950">Ajouter un bien</h1>
        <p className="text-sm text-anthracite-500">
          La référence (NHA-AAAA-000000) est générée automatiquement à l&apos;enregistrement. Le bien est créé en
          brouillon.
        </p>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <PropertyDossierForm
          action={createPropertyDraft}
          submitLabel="Enregistrer le brouillon"
          allTags={allTags}
          canCreateTag={canManageTags(user.role)}
          canAssign={canAssign}
          assignableUsers={assignableUsers}
        />
      </div>
    </div>
  );
}
