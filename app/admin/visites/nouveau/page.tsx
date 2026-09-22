import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/auth/dal";
import { canCreateVisit } from "@/lib/crm/permissions";
import { createVisit } from "@/lib/crm/visit-actions";
import { searchPropertiesForVisitPicker, searchProspectsForVisitPicker } from "@/lib/crm/visit-queries";
import { listCrmAssignableUsers } from "@/lib/crm/prospect-queries";
import { roleLabels } from "@/lib/auth/roles";
import VisitForm from "../_components/VisitForm";

export const metadata: Metadata = {
  title: "Nouvelle visite | NA Business Africa",
};

function prospectLabel(prospect: { firstName: string | null; lastName: string | null; companyName: string | null }): string {
  return prospect.companyName || [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || "Prospect sans nom";
}

export default async function NewVisitPage({ searchParams }: PageProps<"/admin/visites/nouveau">) {
  const user = await requireAdminUser();

  if (!canCreateVisit(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas de planifier de visite.</p>
      </div>
    );
  }

  const sp = await searchParams;
  const initialProspectId = typeof sp.prospectId === "string" ? sp.prospectId : "";
  const initialPropertyId = typeof sp.propertyId === "string" ? sp.propertyId : "";

  const [properties, prospects, users] = await Promise.all([
    searchPropertiesForVisitPicker(),
    searchProspectsForVisitPicker(user.role, user.id),
    listCrmAssignableUsers(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Nouvelle visite</span>
        <h1 className="font-display text-3xl font-semibold text-anthracite-950">Planifier une visite</h1>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <VisitForm
          action={createVisit}
          submitLabel="Planifier la visite"
          initialPropertyId={initialPropertyId}
          initialProspectId={initialProspectId}
          defaultValues={{ assignedToId: user.role === "AGENT" ? user.id : undefined }}
          pickerProperties={properties.map((property) => ({ id: property.id, label: property.titleFr, sublabel: `${property.reference} · ${property.city}` }))}
          pickerProspects={prospects.map((prospect) => ({ id: prospect.id, label: prospectLabel(prospect), sublabel: prospect.reference }))}
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
