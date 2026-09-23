import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/dal";
import { canViewVisit, canEditVisit, canViewProspect, canViewOpportunity, canEditOpportunity, canCreateOpportunity } from "@/lib/crm/permissions";
import { findOpenOpportunityForVisit } from "@/lib/crm/opportunity-queries";
import { linkVisitToOpportunity } from "@/lib/crm/opportunity-actions";
import { opportunityStageLabels } from "@/lib/crm/opportunity-rules";
import { getVisitById } from "@/lib/crm/visit-queries";
import { updateVisit, setVisitStatus } from "@/lib/crm/visit-actions";
import { listCrmAssignableUsers } from "@/lib/crm/prospect-queries";
import { createActivity } from "@/lib/crm/activity-actions";
import { visitStatusLabels, visitTypeLabels, activityTypeLabels, activityStatusLabels } from "@/lib/crm/enum-labels";
import { formatDateTime } from "@/lib/admin/format";
import { roleLabels } from "@/lib/auth/roles";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import VisitForm from "../_components/VisitForm";
import QuickActivityForm from "@/app/admin/_components/QuickActivityForm";

export const metadata: Metadata = {
  title: "Visite | NA Business Africa",
};

const errorMessages: Record<string, string> = {
  permission: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
};

function prospectLabel(prospect: { firstName: string | null; lastName: string | null; companyName: string | null }): string {
  return prospect.companyName || [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || "Prospect sans nom";
}

export default async function VisitDetailPage({ params, searchParams }: PageProps<"/admin/visites/[id]">) {
  const user = await requireAdminUser();
  const { id } = await params;
  const sp = await searchParams;

  const visit = await getVisitById(id);
  if (!visit) notFound();

  if (!canViewVisit(user.role, user.id, visit)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne vous donne pas accès à cette visite.</p>
      </div>
    );
  }

  const canEdit = canEditVisit(user.role, user.id, visit);
  const canSeeProspect = canViewProspect(user.role, user.id, visit.prospect);
  const errorParam = typeof sp.erreur === "string" ? sp.erreur : undefined;
  const errorMessage = errorParam ? errorMessages[errorParam] : undefined;

  const [users, candidateOpportunity] = await Promise.all([
    listCrmAssignableUsers(),
    !visit.opportunityId && visit.status === "REALISEE" ? findOpenOpportunityForVisit(visit.prospectId, visit.propertyId) : Promise.resolve(null),
  ]);
  // Phase 6L: a "visite réalisée" either updates its opportunity or seeds a new one.
  const linkedOpportunity = visit.opportunity && canViewOpportunity(user.role, user.id, visit.opportunity) ? visit.opportunity : null;
  const attachableOpportunity =
    candidateOpportunity && canEdit && canEditOpportunity(user.role, user.id, candidateOpportunity) ? candidateOpportunity : null;
  const canSeedOpportunity = !visit.opportunityId && visit.status === "REALISEE" && canCreateOpportunity(user.role) && canSeeProspect;
  const boundUpdate = updateVisit.bind(null, visit.id);
  const boundCreateActivity = createActivity.bind(null, { prospectId: visit.prospectId, propertyId: visit.propertyId, visitId: visit.id });

  return (
    <div className="flex flex-col gap-8">
      {errorMessage && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">{visit.reference}</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">{visit.property.titleFr}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="outline">{visitTypeLabels[visit.type]}</Badge>
            <Badge tone={visit.status === "REALISEE" ? "anthracite" : "gold"}>{visitStatusLabels[visit.status]}</Badge>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={`/admin/biens/${visit.property.id}`} className="font-medium text-gold-600 hover:text-gold-500">
              Voir le bien ({visit.property.reference})
            </Link>
            {canSeeProspect && (
              <Link href={`/admin/prospects/${visit.prospect.id}`} className="font-medium text-gold-600 hover:text-gold-500">
                Voir le prospect ({visit.prospect.reference})
              </Link>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {visit.status === "PLANIFIEE" && (
              <form action={setVisitStatus.bind(null, visit.id, "CONFIRMEE")}>
                <Button type="submit" size="sm">
                  Confirmer
                </Button>
              </form>
            )}
            {(visit.status === "PLANIFIEE" || visit.status === "CONFIRMEE") && (
              <form action={setVisitStatus.bind(null, visit.id, "ABSENT")}>
                <Button type="submit" variant="ghost" size="sm" className="border border-anthracite-200 hover:border-gold-500">
                  Marquer absent
                </Button>
              </form>
            )}
            {(visit.status === "PLANIFIEE" || visit.status === "CONFIRMEE") && (
              <form action={setVisitStatus.bind(null, visit.id, "ANNULEE")}>
                <Button type="submit" variant="ghost" size="sm" className="border border-anthracite-200 hover:border-gold-500">
                  Annuler
                </Button>
              </form>
            )}
          </div>
        )}
      </div>

      {(linkedOpportunity || attachableOpportunity || canSeedOpportunity) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-300 bg-gold-200/30 p-4">
          <p className="text-sm text-anthracite-800">
            {linkedOpportunity
              ? `Visite rattachée à l'opportunité ${linkedOpportunity.reference} (${opportunityStageLabels[linkedOpportunity.stage]}).`
              : attachableOpportunity
                ? `Une opportunité ouverte existe pour ce prospect : ${attachableOpportunity.reference} (${opportunityStageLabels[attachableOpportunity.stage]}).`
                : "Visite réalisée : transformez-la en opportunité commerciale."}
          </p>
          <div className="flex flex-wrap gap-2">
            {linkedOpportunity && (
              <Button href={`/admin/opportunites/${linkedOpportunity.id}`} size="sm">
                Mettre à jour l&apos;opportunité
              </Button>
            )}
            {!linkedOpportunity && attachableOpportunity && (
              <form action={linkVisitToOpportunity.bind(null, attachableOpportunity.id)}>
                <input type="hidden" name="visitId" value={visit.id} />
                <Button type="submit" size="sm">
                  Mettre à jour l&apos;opportunité
                </Button>
              </form>
            )}
            {!linkedOpportunity && canSeedOpportunity && (
              <Button
                href={`/admin/opportunites/nouveau?visitId=${visit.id}`}
                variant={attachableOpportunity ? "ghost" : "primary"}
                size="sm"
                className={attachableOpportunity ? "border border-anthracite-200 hover:border-gold-500" : ""}
              >
                Créer une opportunité
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 rounded-2xl border border-anthracite-100 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Prospect" value={canSeeProspect ? prospectLabel(visit.prospect) : "—"} />
        <Info label="Agent responsable" value={visit.assignedTo?.name ?? visit.assignedTo?.email ?? "—"} />
        <Info label="Début" value={formatDateTime(visit.scheduledStart)} />
        <Info label="Fin" value={visit.scheduledEnd ? formatDateTime(visit.scheduledEnd) : "—"} />
        <Info label="Participants" value={visit.participantsCount ? String(visit.participantsCount) : "—"} />
        <Info label="Créé par" value={visit.createdBy.name ?? visit.createdBy.email} />
        <Info label="Prochaine relance" value={visit.nextFollowUpAt ? formatDateTime(visit.nextFollowUpAt) : "—"} />
      </div>

      {canEdit && (
        <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
          <h2 className="font-display text-lg font-semibold text-anthracite-950">Modifier / compte-rendu de visite</h2>
          <div className="mt-6">
            <VisitForm
              action={boundUpdate}
              submitLabel="Enregistrer les modifications"
              showReportFields
              fixedProperty={{ reference: visit.property.reference, label: visit.property.titleFr }}
              fixedProspect={{ reference: visit.prospect.reference, label: canSeeProspect ? prospectLabel(visit.prospect) : "Prospect" }}
              assignableUsers={users.map((candidate) => ({
                id: candidate.id,
                label: candidate.name ?? candidate.email,
                sublabel: roleLabels[candidate.role],
              }))}
              defaultValues={{
                assignedToId: visit.assignedToId ?? undefined,
                scheduledStart: visit.scheduledStart.toISOString().slice(0, 16),
                scheduledEnd: visit.scheduledEnd ? visit.scheduledEnd.toISOString().slice(0, 16) : undefined,
                status: visit.status,
                type: visit.type,
                participantsCount: visit.participantsCount ?? undefined,
                preVisitNote: visit.preVisitNote ?? undefined,
                prospectFeedback: visit.prospectFeedback ?? undefined,
                internalNote: visit.internalNote ?? undefined,
                postVisitInterest: visit.postVisitInterest ?? undefined,
                nextFollowUpAt: visit.nextFollowUpAt ? visit.nextFollowUpAt.toISOString().slice(0, 16) : undefined,
              }}
            />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Actions liées à cette visite ({visit.activities.length})</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {visit.activities.map((activity) => (
            <li key={activity.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
              <span className="text-sm text-anthracite-900">{activity.title}</span>
              <div className="flex items-center gap-2">
                <Badge tone="outline">{activityTypeLabels[activity.type]}</Badge>
                <Badge tone="outline">{activityStatusLabels[activity.status]}</Badge>
              </div>
            </li>
          ))}
          {visit.activities.length === 0 && <p className="text-sm text-anthracite-400">Aucune action liée pour le moment.</p>}
        </ul>

        {canEdit && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-anthracite-700">Proposer une prochaine relance</p>
            <QuickActivityForm action={boundCreateActivity} />
          </div>
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
