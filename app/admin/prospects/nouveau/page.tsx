import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/auth/dal";
import { canCreateProspect } from "@/lib/crm/permissions";
import { createProspect } from "@/lib/crm/prospect-actions";
import { listCrmAssignableUsers } from "@/lib/crm/prospect-queries";
import { roleLabels } from "@/lib/auth/roles";
import ProspectForm from "../_components/ProspectForm";

export const metadata: Metadata = {
  title: "Nouveau prospect | NA Business Africa",
};

export default async function NewProspectPage() {
  const user = await requireAdminUser();

  if (!canCreateProspect(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas de créer de prospect.</p>
      </div>
    );
  }

  const users = await listCrmAssignableUsers();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Nouveau prospect</span>
        <h1 className="font-display text-3xl font-semibold text-anthracite-950">Ajouter un prospect</h1>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <ProspectForm
          action={createProspect}
          submitLabel="Créer le prospect"
          defaultValues={{ assignedToId: user.role === "AGENT" ? user.id : undefined }}
          assignableUsers={users.map((candidate) => ({
            id: candidate.id,
            label: candidate.name ?? candidate.email,
            sublabel: roleLabels[candidate.role],
          }))}
        />
      </div>
    </div>
  );
}
