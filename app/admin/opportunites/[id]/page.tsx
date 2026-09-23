import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/dal";
import {
  canViewOpportunity,
  canEditOpportunity,
  canOverrideOpportunityProbability,
  canReopenOpportunity,
  canViewProspect,
  canViewVisit,
  canEditVisit,
  canCreateActivity,
  canEditActivity,
  canCreateVisit,
} from "@/lib/crm/permissions";
import { canManageFinance } from "@/lib/finance/permissions";
import {
  getOpportunityById,
  listLinkableVisits,
  getOpportunityCommissions,
  listLinkableCommissionCases,
  searchPropertiesForOpportunityPicker,
} from "@/lib/crm/opportunity-queries";
import {
  updateOpportunity,
  changeOpportunityStage,
  overrideOpportunityProbability,
  linkVisitToOpportunity,
  unlinkVisitFromOpportunity,
  linkCommissionCaseToOpportunity,
  unlinkCommissionCaseFromOpportunity,
} from "@/lib/crm/opportunity-actions";
import { createActivity, setActivityStatus } from "@/lib/crm/activity-actions";
import { listCrmAssignableUsers } from "@/lib/crm/prospect-queries";
import {
  opportunityStageLabels,
  opportunityTransactionLabels,
  opportunityLossReasonLabels,
  defaultStageProbability,
  propertyAvailabilityAlert,
  weightedAmount,
  isClosedStage,
  isOpportunityDormant,
  OPPORTUNITY_INACTIVITY_DAYS,
} from "@/lib/crm/opportunity-rules";
import {
  prospectStatusLabels,
  prospectTypeLabels,
  visitStatusLabels,
  activityTypeLabels,
  activityStatusLabels,
} from "@/lib/crm/enum-labels";
import { commissionCaseStatusLabels } from "@/lib/finance/enum-labels";
import { propertyStatusFromDb, propertyStatusLabels, publicationStatusLabels, propertyTypeFromDb } from "@/lib/admin/property-enum-maps";
import { propertyTypeLabels } from "@/lib/property-schema";
import { madAmount, formatDateTime, formatPrice } from "@/lib/admin/format";
import { roleLabels } from "@/lib/auth/roles";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import QuickActivityForm from "@/app/admin/_components/QuickActivityForm";
import OpportunityForm from "../_components/OpportunityForm";
import StageChangeForm from "../_components/StageChangeForm";
import ProbabilityForm from "../_components/ProbabilityForm";

export const metadata: Metadata = {
  title: "Opportunité | NA Business Africa",
};

const errorMessages: Record<string, string> = {
  permission: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
  visite: "Cette visite ne peut pas être rattachée : elle doit concerner le même prospect et vous être accessible.",
  commission: "Ce dossier de commission ne peut pas être lié : il doit porter sur le même bien et ne pas être déjà lié.",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

function prospectDisplayName(prospect: { firstName: string | null; lastName: string | null; companyName: string | null; reference: string }): string {
  return prospect.companyName || [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || prospect.reference;
}

function userLabel(user: { name: string | null; email: string } | null): string {
  return user ? (user.name ?? user.email) : "—";
}

export default async function OpportunityDetailPage({ params, searchParams }: PageProps<"/admin/opportunites/[id]">) {
  const user = await requireAdminUser();
  const { id } = await params;
  const sp = await searchParams;

  const opportunity = await getOpportunityById(id);
  if (!opportunity) notFound();

  if (!canViewOpportunity(user.role, user.id, opportunity)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne vous donne pas accès à cette opportunité.</p>
      </div>
    );
  }

  const isAdmin = canOverrideOpportunityProbability(user.role);
  const canSeeFinance = canManageFinance(user.role);
  const closed = isClosedStage(opportunity.stage);
  const canEdit = canEditOpportunity(user.role, user.id, opportunity);
  const canEditRecord = canEdit && (!closed || canReopenOpportunity(user.role));
  const canSeeProspect = canViewProspect(user.role, user.id, opportunity.prospect);
  const canAddActivity = canEdit && canCreateActivity(user.role);

  const errorParam = typeof sp.erreur === "string" ? sp.erreur : undefined;
  const errorMessage = errorParam ? errorMessages[errorParam] : undefined;

  const [users, properties, linkableVisits, finance, linkableCommissions] = await Promise.all([
    canEditRecord ? listCrmAssignableUsers() : Promise.resolve([]),
    canEditRecord ? searchPropertiesForOpportunityPicker() : Promise.resolve([]),
    canEdit ? listLinkableVisits(opportunity.prospectId, opportunity.id) : Promise.resolve([]),
    canSeeFinance ? getOpportunityCommissions(opportunity.id) : Promise.resolve(null),
    canSeeFinance && opportunity.propertyId ? listLinkableCommissionCases(opportunity.propertyId) : Promise.resolve([]),
  ]);

  // Same convention as the prospect 360°: whatever hangs off a record the user can view is shown with it.
  const visibleVisits = opportunity.visits;
  const visibleActivities = opportunity.activities;
  const pickableVisits = linkableVisits.filter((visit) => canViewVisit(user.role, user.id, visit));

  const estimated = opportunity.estimatedAmount === null ? null : Number(opportunity.estimatedAmount);
  const weighted = weightedAmount(estimated, opportunity.probability);
  const alert = propertyAvailabilityAlert(opportunity.property, opportunity.stage);
  const dormant = isOpportunityDormant(opportunity.lastActivityAt, opportunity.stage);
  const needsCommission = canSeeFinance && opportunity.stage === "GAGNEE" && finance !== null && finance.cases.length === 0;

  const pickerProperties = properties.map((property) => ({ id: property.id, label: property.titleFr, sublabel: `${property.reference} · ${property.city}` }));
  if (opportunity.property && !pickerProperties.some((option) => option.id === opportunity.property!.id)) {
    pickerProperties.unshift({ id: opportunity.property.id, label: opportunity.property.titleFr, sublabel: `${opportunity.property.reference} · bien actuel` });
  }

  const commissionHref = opportunity.propertyId
    ? `/admin/commissions/nouveau?propertyId=${opportunity.propertyId}&opportunityId=${opportunity.id}`
    : null;

  return (
    <div className="flex flex-col gap-8">
      {errorMessage && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">{opportunity.reference}</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">{opportunity.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={closed ? "anthracite" : "gold"}>{opportunityStageLabels[opportunity.stage]}</Badge>
            <Badge tone="outline">{opportunityTransactionLabels[opportunity.transaction]}</Badge>
            {opportunity.probabilityIsManual && <Badge tone="outline">Probabilité ajustée</Badge>}
          </div>
        </div>
        <Link href="/admin/opportunites" className="text-sm font-medium text-gold-600 hover:text-gold-500">
          ← Pipeline
        </Link>
      </div>

      {alert && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Attention : {alert}. Vérifiez que l&apos;opportunité est toujours d&apos;actualité ou rattachez un autre bien.
        </p>
      )}
      {dormant && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucune activité depuis plus de {OPPORTUNITY_INACTIVITY_DAYS} jours (dernière : {formatDateTime(opportunity.lastActivityAt)}).
        </p>
      )}
      {needsCommission && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold-300 bg-gold-200/30 px-4 py-3">
          <p className="text-sm text-anthracite-800">
            Opportunité gagnée : aucun dossier de commission n&apos;est encore lié. Rien n&apos;est créé automatiquement.
          </p>
          {commissionHref && (
            <Button href={commissionHref} size="sm">
              Créer le dossier de commission
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-4 rounded-2xl border border-anthracite-100 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Montant estimé du deal" value={madAmount(estimated)} />
        <Info label="Probabilité" value={`${opportunity.probability} %${opportunity.probabilityIsManual ? " (ajustée)" : ""}`} />
        <Info label="Prévisionnel pondéré" value={closed ? "—" : madAmount(weighted)} />
        <Info label="Clôture estimée" value={opportunity.expectedCloseDate ? dateFormatter.format(opportunity.expectedCloseDate) : "—"} />
        {opportunity.stage === "GAGNEE" && <Info label="Montant final du deal" value={madAmount(opportunity.finalAmount)} />}
        {closed && <Info label="Date de clôture" value={opportunity.closedAt ? dateFormatter.format(opportunity.closedAt) : "—"} />}
        {opportunity.stage === "PERDUE" && (
          <Info label="Motif de perte" value={opportunity.lossReason ? opportunityLossReasonLabels[opportunity.lossReason] : "—"} />
        )}
        <Info label="Agent responsable" value={userLabel(opportunity.assignedTo)} />
        <Info label="Créée par" value={userLabel(opportunity.createdBy)} />
        <Info label="Créée le" value={formatDateTime(opportunity.createdAt)} />
        <Info label="Dernière activité" value={formatDateTime(opportunity.lastActivityAt)} />
      </div>

      {(opportunity.internalNote || opportunity.lossNote) && (
        <div className="grid gap-4 rounded-2xl border border-anthracite-100 bg-white p-6 sm:grid-cols-2">
          {opportunity.internalNote && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-anthracite-400">Note interne</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-anthracite-700">{opportunity.internalNote}</p>
            </div>
          )}
          {opportunity.lossNote && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-anthracite-400">Précision sur la perte</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-anthracite-700">{opportunity.lossNote}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-anthracite-100 bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-anthracite-950">Prospect</h2>
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-sm font-medium text-anthracite-900">{prospectDisplayName(opportunity.prospect)}</span>
            <span className="text-xs text-anthracite-400">
              {opportunity.prospect.reference} · {prospectTypeLabels[opportunity.prospect.type]} · {prospectStatusLabels[opportunity.prospect.status]}
            </span>
            {canSeeProspect && (
              <Link href={`/admin/prospects/${opportunity.prospect.id}`} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                Ouvrir la fiche prospect
              </Link>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-anthracite-100 bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-anthracite-950">Bien</h2>
          {opportunity.property ? (
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-sm font-medium text-anthracite-900">{opportunity.property.titleFr}</span>
              <span className="text-xs text-anthracite-400">
                {opportunity.property.reference} · {propertyTypeLabels[propertyTypeFromDb[opportunity.property.propertyType]]} ·{" "}
                {opportunity.property.district ? `${opportunity.property.city} — ${opportunity.property.district}` : opportunity.property.city}
              </span>
              <span className="text-xs text-anthracite-500">
                {formatPrice(opportunity.property.price, opportunity.property.priceOnRequest)} ·{" "}
                {propertyStatusLabels[propertyStatusFromDb[opportunity.property.status]]} · {publicationStatusLabels[opportunity.property.publicationStatus]}
              </span>
              <Link href={`/admin/biens/${opportunity.property.id}`} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                Ouvrir le dossier du bien
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-anthracite-400">Aucun bien rattaché — obligatoire à partir du stade Visite.</p>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-anthracite-100 bg-white p-6">
            <h2 className="font-display text-lg font-semibold text-anthracite-950">Actions rapides — stade</h2>
            <div className="mt-4">
              {closed && !canReopenOpportunity(user.role) ? (
                <p className="text-sm text-anthracite-400">Opportunité clôturée : seul un administrateur peut la rouvrir.</p>
              ) : (
                <StageChangeForm
                  key={opportunity.stage}
                  action={changeOpportunityStage.bind(null, opportunity.id)}
                  currentStage={opportunity.stage}
                  hasProperty={Boolean(opportunity.propertyId)}
                  estimatedAmount={estimated}
                />
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {canCreateVisit(user.role) && opportunity.propertyId && (
                <Button
                  href={`/admin/visites/nouveau?prospectId=${opportunity.prospectId}&propertyId=${opportunity.propertyId}&opportunityId=${opportunity.id}`}
                  variant="ghost"
                  size="sm"
                  className="border border-anthracite-200 hover:border-gold-500"
                >
                  + Planifier une visite
                </Button>
              )}
            </div>
          </div>

          {isAdmin && !closed && (
            <div className="rounded-2xl border border-anthracite-100 bg-white p-6">
              <h2 className="font-display text-lg font-semibold text-anthracite-950">Probabilité (administrateur)</h2>
              <p className="mt-1 text-xs text-anthracite-400">
                Recalculée au défaut du stade à chaque changement de stade. L&apos;ajustement reste valable jusqu&apos;au prochain changement.
              </p>
              <div className="mt-4">
                <ProbabilityForm
                  key={`${opportunity.stage}-${opportunity.probability}`}
                  action={overrideOpportunityProbability.bind(null, opportunity.id)}
                  probability={opportunity.probability}
                  stageDefault={defaultStageProbability[opportunity.stage]}
                  isManual={opportunity.probabilityIsManual}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {canEditRecord && (
        <details className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
          <summary className="cursor-pointer font-display text-lg font-semibold text-anthracite-950">Modifier l&apos;opportunité</summary>
          <div className="mt-6">
            <OpportunityForm
              action={updateOpportunity.bind(null, opportunity.id)}
              submitLabel="Enregistrer les modifications"
              pickerProperties={pickerProperties}
              assignableUsers={users.map((candidate) => ({ id: candidate.id, label: candidate.name ?? candidate.email, sublabel: roleLabels[candidate.role] }))}
              defaultValues={{
                propertyId: opportunity.propertyId ?? undefined,
                transaction: opportunity.transaction,
                title: opportunity.title,
                estimatedAmount: estimated ?? undefined,
                expectedCloseDate: opportunity.expectedCloseDate ? opportunity.expectedCloseDate.toISOString().slice(0, 10) : undefined,
                assignedToId: opportunity.assignedToId ?? undefined,
                internalNote: opportunity.internalNote ?? undefined,
              }}
            />
          </div>
        </details>
      )}

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Visites ({visibleVisits.length})</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {visibleVisits.map((visit) => (
            <li key={visit.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-anthracite-900">{visit.property.titleFr}</span>
                <span className="text-xs text-anthracite-400">
                  {visit.reference} · {formatDateTime(visit.scheduledStart)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone="outline">{visitStatusLabels[visit.status]}</Badge>
                <Link href={`/admin/visites/${visit.id}`} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                  Voir
                </Link>
                {canEdit && canEditVisit(user.role, user.id, visit) && (
                  <form action={unlinkVisitFromOpportunity.bind(null, opportunity.id, visit.id)}>
                    <button type="submit" className="text-xs font-medium text-anthracite-400 hover:text-red-600">
                      Détacher
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
          {visibleVisits.length === 0 && <p className="text-sm text-anthracite-400">Aucune visite rattachée.</p>}
        </ul>
        {canEdit && pickableVisits.length > 0 && (
          <form action={linkVisitToOpportunity.bind(null, opportunity.id)} className="mt-4 flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Rattacher une visite du prospect</span>
              <select name="visitId" required className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500">
                {pickableVisits.map((visit) => (
                  <option key={visit.id} value={visit.id}>
                    {visit.reference} — {visit.property.titleFr} ({visitStatusLabels[visit.status]}){visit.opportunityId ? " · déjà liée ailleurs" : ""}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" variant="ghost" size="sm" className="border border-anthracite-200 hover:border-gold-500">
              Rattacher
            </Button>
          </form>
        )}
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Activités ({visibleActivities.length})</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {visibleActivities.map((activity) => (
            <li key={activity.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-anthracite-900">{activity.title}</span>
                <span className="text-xs text-anthracite-400">
                  {activityTypeLabels[activity.type]}
                  {activity.dueAt ? ` · échéance ${formatDateTime(activity.dueAt)}` : ""}
                  {activity.assignedTo ? ` · ${userLabel(activity.assignedTo)}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone="outline">{activityStatusLabels[activity.status]}</Badge>
                {activity.status === "A_FAIRE" && canEditActivity(user.role, user.id, activity) && (
                  <>
                    <form action={setActivityStatus.bind(null, activity.id, "TERMINEE")}>
                      <button type="submit" className="text-xs font-medium text-green-700 hover:text-green-600">
                        Terminer
                      </button>
                    </form>
                    <form action={setActivityStatus.bind(null, activity.id, "ANNULEE")}>
                      <button type="submit" className="text-xs font-medium text-anthracite-400 hover:text-red-600">
                        Annuler
                      </button>
                    </form>
                  </>
                )}
              </div>
            </li>
          ))}
          {visibleActivities.length === 0 && <p className="text-sm text-anthracite-400">Aucune activité pour le moment.</p>}
        </ul>
        {canAddActivity && (
          <div className="mt-6">
            <QuickActivityForm
              action={createActivity.bind(null, {
                prospectId: opportunity.prospectId,
                propertyId: opportunity.propertyId,
                opportunityId: opportunity.id,
              })}
            />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Historique des stades</h2>
        <ol className="mt-4 flex flex-col gap-3 border-l border-anthracite-100 pl-4">
          {opportunity.stageHistory.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-0.5">
              <span className="text-sm text-anthracite-900">
                {entry.fromStage ? `${opportunityStageLabels[entry.fromStage]} → ` : "Création au stade "}
                <strong>{opportunityStageLabels[entry.toStage]}</strong>
              </span>
              <span className="text-xs text-anthracite-400">
                {formatDateTime(entry.createdAt)} · {userLabel(entry.changedBy)}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {canSeeFinance && finance && (
        <div className="rounded-2xl border border-gold-300 bg-white p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-anthracite-950">Panneau financier (administrateur)</h2>
            {commissionHref && (
              <Button href={commissionHref} variant="ghost" size="sm" className="border border-anthracite-200 hover:border-gold-500">
                + Créer un dossier de commission
              </Button>
            )}
          </div>
          <p className="mt-1 text-xs text-anthracite-400">
            Montants issus uniquement des dossiers de commission liés et de leurs paiements enregistrés (reçus / partiels) — jamais calculés depuis
            l&apos;opportunité.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1 rounded-xl border border-anthracite-100 p-4">
              <span className="text-xs uppercase tracking-wider text-anthracite-500">Commissions prévues</span>
              <span className="font-display text-2xl font-semibold text-anthracite-950">{madAmount(finance.commissionsPrevues)}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-anthracite-100 p-4">
              <span className="text-xs uppercase tracking-wider text-anthracite-500">Commissions encaissées</span>
              <span className="font-display text-2xl font-semibold text-anthracite-950">{madAmount(finance.commissionsEncaissees)}</span>
            </div>
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {finance.cases.map((commissionCase) => (
              <li key={commissionCase.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
                <div className="flex flex-col">
                  <Link href={`/admin/commissions/${commissionCase.id}`} className="text-sm font-medium text-anthracite-900 hover:text-gold-600">
                    {commissionCase.reference}
                  </Link>
                  <span className="text-xs text-anthracite-400">
                    Prévue {madAmount(commissionCase.planned)} · encaissée {madAmount(commissionCase.collected)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone="outline">{commissionCaseStatusLabels[commissionCase.status]}</Badge>
                  <form action={unlinkCommissionCaseFromOpportunity.bind(null, opportunity.id, commissionCase.id)}>
                    <button type="submit" className="text-xs font-medium text-anthracite-400 hover:text-red-600">
                      Délier
                    </button>
                  </form>
                </div>
              </li>
            ))}
            {finance.cases.length === 0 && <p className="text-sm text-anthracite-400">Aucun dossier de commission lié.</p>}
          </ul>
          {linkableCommissions.length > 0 && (
            <form action={linkCommissionCaseToOpportunity.bind(null, opportunity.id)} className="mt-4 flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Lier un dossier existant du bien</span>
                <select name="commissionCaseId" required className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500">
                  {linkableCommissions.map((commissionCase) => (
                    <option key={commissionCase.id} value={commissionCase.id}>
                      {commissionCase.reference} ({commissionCaseStatusLabels[commissionCase.status]})
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit" variant="ghost" size="sm" className="border border-anthracite-200 hover:border-gold-500">
                Lier
              </Button>
            </form>
          )}
        </div>
      )}
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
