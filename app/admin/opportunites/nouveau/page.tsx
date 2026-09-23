import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/dal";
import { canCreateOpportunity, canViewProspect, canViewVisit } from "@/lib/crm/permissions";
import { createOpportunity } from "@/lib/crm/opportunity-actions";
import {
  searchProspectsForOpportunityPicker,
  searchPropertiesForOpportunityPicker,
  getOpportunityPrefillFromVisit,
  getPropertyPrefill,
  getProspectPrefill,
} from "@/lib/crm/opportunity-queries";
import { listCrmAssignableUsers } from "@/lib/crm/prospect-queries";
import { roleLabels } from "@/lib/auth/roles";
import OpportunityForm, { type OpportunityFormDefaults } from "../_components/OpportunityForm";

export const metadata: Metadata = {
  title: "Nouvelle opportunité | NA Business Africa",
};

function prospectLabel(prospect: { firstName: string | null; lastName: string | null; companyName: string | null; reference: string }): string {
  const name = prospect.companyName || [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || "Prospect sans nom";
  return `${name} (${prospect.reference})`;
}

export default async function NewOpportunityPage({ searchParams }: PageProps<"/admin/opportunites/nouveau">) {
  const user = await requireAdminUser();

  if (!canCreateOpportunity(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas de créer d&apos;opportunité.</p>
      </div>
    );
  }

  const sp = await searchParams;
  const visitIdParam = typeof sp.visitId === "string" ? sp.visitId : "";
  let prospectIdParam = typeof sp.prospectId === "string" ? sp.prospectId : "";
  let propertyIdParam = typeof sp.propertyId === "string" ? sp.propertyId : "";

  const defaults: OpportunityFormDefaults = { assignedToId: user.role === "AGENT" ? user.id : undefined };
  let visitId: string | undefined;
  let sourceLabel: string | null = null;

  // From a visit: prospect + bien come from the visit, stage starts at VISITE.
  if (visitIdParam) {
    const visit = await getOpportunityPrefillFromVisit(visitIdParam);
    if (visit && canViewVisit(user.role, user.id, visit)) {
      if (visit.opportunityId) redirect(`/admin/opportunites/${visit.opportunityId}`);
      visitId = visit.id;
      prospectIdParam = visit.prospectId;
      propertyIdParam = visit.propertyId;
      defaults.stage = "VISITE";
      sourceLabel = `Depuis la visite ${visit.reference}`;
    }
  }

  if (propertyIdParam) {
    const property = await getPropertyPrefill(propertyIdParam);
    if (property) {
      defaults.propertyId = property.id;
      defaults.transaction = property.transaction;
      defaults.title = property.titleFr;
      defaults.estimatedAmount = property.price ? Number(property.price) : undefined;
      sourceLabel = sourceLabel ?? `Depuis le bien ${property.titleFr}`;
    }
  }

  let fixedProspect: { id: string; label: string } | undefined;
  if (prospectIdParam) {
    const prospect = await getProspectPrefill(prospectIdParam);
    if (prospect && canViewProspect(user.role, user.id, prospect)) {
      fixedProspect = { id: prospect.id, label: prospectLabel(prospect) };
    }
  }

  const [prospects, properties, users] = await Promise.all([
    fixedProspect ? Promise.resolve([]) : searchProspectsForOpportunityPicker(user.role, user.id),
    searchPropertiesForOpportunityPicker(),
    listCrmAssignableUsers(),
  ]);

  // Keep the pre-selected bien selectable even if it is archived (outside the default picker scope).
  const pickerProperties = properties.map((property) => ({ id: property.id, label: property.titleFr, sublabel: `${property.reference} · ${property.city}` }));
  if (defaults.propertyId && !pickerProperties.some((option) => option.id === defaults.propertyId)) {
    pickerProperties.unshift({ id: defaults.propertyId, label: defaults.title ?? "Bien sélectionné", sublabel: "Bien pré-sélectionné" });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Nouvelle opportunité</span>
        <h1 className="font-display text-3xl font-semibold text-anthracite-950">Créer une opportunité</h1>
        {sourceLabel && <p className="text-sm text-anthracite-500">{sourceLabel}</p>}
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <OpportunityForm
          action={createOpportunity}
          submitLabel="Créer l'opportunité"
          defaultValues={defaults}
          fixedProspect={fixedProspect}
          pickerProspects={prospects.map((prospect) => ({ id: prospect.id, label: prospectLabel(prospect) }))}
          pickerProperties={pickerProperties}
          assignableUsers={users.map((candidate) => ({ id: candidate.id, label: candidate.name ?? candidate.email, sublabel: roleLabels[candidate.role] }))}
          visitId={visitId}
          showInitialStage
        />
      </div>
    </div>
  );
}
