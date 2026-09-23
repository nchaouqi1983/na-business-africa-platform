import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/dal";
import { canViewProspect, canEditProspect } from "@/lib/crm/permissions";
import { getProspectById, listCrmAssignableUsers, searchPropertiesForInterestPicker } from "@/lib/crm/prospect-queries";
import { updateProspect, setProspectStatus, upsertPropertyInterest, removePropertyInterest } from "@/lib/crm/prospect-actions";
import { createActivity, setActivityStatus } from "@/lib/crm/activity-actions";
import {
  prospectTypeLabels,
  prospectStatusLabels,
  prospectStatusOptions,
  prospectLanguageLabels,
  prospectSourceLabels,
  prospectFormOriginLabels,
  interestLevelLabels,
  visitStatusLabels,
  visitTypeLabels,
  activityTypeLabels,
  activityStatusLabels,
} from "@/lib/crm/enum-labels";
import { madAmount, formatDateTime } from "@/lib/admin/format";
import { roleLabels } from "@/lib/auth/roles";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import ProspectForm from "../_components/ProspectForm";
import PropertyInterestForm from "../_components/PropertyInterestForm";
import QuickActivityForm from "@/app/admin/_components/QuickActivityForm";

export const metadata: Metadata = {
  title: "Prospect | NA Business Africa",
};

const errorMessages: Record<string, string> = {
  permission: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
};

function prospectDisplayName(prospect: { kind: string; firstName: string | null; lastName: string | null; companyName: string | null }): string {
  if (prospect.kind === "SOCIETE" && prospect.companyName) return prospect.companyName;
  return [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || "Prospect sans nom";
}

export default async function ProspectDetailPage({ params, searchParams }: PageProps<"/admin/prospects/[id]">) {
  const user = await requireAdminUser();
  const { id } = await params;
  const sp = await searchParams;

  const prospect = await getProspectById(id);
  if (!prospect) notFound();

  if (!canViewProspect(user.role, user.id, prospect)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne vous donne pas accès à ce prospect.</p>
      </div>
    );
  }

  const canEdit = canEditProspect(user.role, user.id, prospect);
  const errorParam = typeof sp.erreur === "string" ? sp.erreur : undefined;
  const errorMessage = errorParam ? errorMessages[errorParam] : undefined;

  const [users, pickerProperties] = await Promise.all([listCrmAssignableUsers(), searchPropertiesForInterestPicker(id)]);

  const boundUpdate = updateProspect.bind(null, prospect.id);
  const boundStatus = setProspectStatus.bind(null, prospect.id);
  const boundUpsertInterest = upsertPropertyInterest.bind(null, prospect.id);
  const boundCreateActivity = createActivity.bind(null, { prospectId: prospect.id });

  const openActivities = prospect.activities.filter((activity) => activity.status === "A_FAIRE");
  const closedActivities = prospect.activities.filter((activity) => activity.status !== "A_FAIRE");

  return (
    <div className="flex flex-col gap-8">
      {errorMessage && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">{prospect.reference}</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">{prospectDisplayName(prospect)}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="outline">{prospectTypeLabels[prospect.type]}</Badge>
            <Badge tone="gold">{prospectStatusLabels[prospect.status]}</Badge>
            {prospect.formOrigin && (
              <>
                <Badge tone="anthracite">Site web</Badge>
                <Badge tone="outline">{prospectFormOriginLabels[prospect.formOrigin]}</Badge>
              </>
            )}
          </div>
        </div>

        {canEdit && (
          <form action={boundStatus} className="flex items-end gap-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Changer le statut</span>
              <select name="status" defaultValue={prospect.status} className="rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500">
                {prospectStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" variant="ghost" size="sm" className="border border-anthracite-200 hover:border-gold-500">
              Mettre à jour
            </Button>
          </form>
        )}
      </div>

      <div className="grid gap-4 rounded-2xl border border-anthracite-100 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Téléphone" value={prospect.phone} />
        <Info label="E-mail" value={prospect.email ?? "—"} />
        <Info label="Langue préférée" value={prospectLanguageLabels[prospect.preferredLanguage]} />
        <Info label="Source" value={prospectSourceLabels[prospect.source]} />
        <Info label="Budget" value={`${madAmount(prospect.budgetMin)} — ${madAmount(prospect.budgetMax)}`} />
        <Info label="Villes recherchées" value={prospect.searchCities.length ? prospect.searchCities.join(", ") : "—"} />
        <Info label="Quartiers recherchés" value={prospect.searchDistricts.length ? prospect.searchDistricts.join(", ") : "—"} />
        <Info label="Échéance / projet" value={prospect.projectTimeline ?? "—"} />
        <Info label="Agent assigné" value={prospect.assignedTo?.name ?? prospect.assignedTo?.email ?? "Non assigné"} />
        <Info
          label="Créé par"
          value={prospect.createdBy ? prospect.createdBy.name ?? prospect.createdBy.email : "Formulaire public (site web)"}
        />
        <Info label="Créé le" value={formatDateTime(prospect.createdAt)} />
      </div>

      {prospect.internalNotes && (
        <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
          <h2 className="font-display text-lg font-semibold text-anthracite-950">Historique de la demande &amp; critères reçus</h2>
          <p className="mt-1 text-xs text-anthracite-400">
            Contenu des formulaires publics reçus (et, en cas de doublon téléphone/e-mail, des demandes suivantes fusionnées ici) — jamais écrasé.
          </p>
          <p className="mt-4 whitespace-pre-wrap text-sm text-anthracite-700">{prospect.internalNotes}</p>
        </div>
      )}

      {canEdit && (
        <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
          <h2 className="font-display text-lg font-semibold text-anthracite-950">Modifier le prospect</h2>
          <div className="mt-6">
            <ProspectForm
              action={boundUpdate}
              submitLabel="Enregistrer les modifications"
              assignableUsers={users.map((candidate) => ({
                id: candidate.id,
                label: candidate.name ?? candidate.email,
                sublabel: roleLabels[candidate.role],
              }))}
              defaultValues={{
                type: prospect.type,
                kind: prospect.kind,
                firstName: prospect.firstName ?? undefined,
                lastName: prospect.lastName ?? undefined,
                companyName: prospect.companyName ?? undefined,
                phone: prospect.phone,
                email: prospect.email ?? undefined,
                preferredLanguage: prospect.preferredLanguage,
                source: prospect.source,
                status: prospect.status,
                searchCities: prospect.searchCities.join(", "),
                searchDistricts: prospect.searchDistricts.join(", "),
                searchPropertyTypes: prospect.searchPropertyTypes,
                searchTransaction: prospect.searchTransaction ?? undefined,
                budgetMin: prospect.budgetMin ? Number(prospect.budgetMin) : undefined,
                budgetMax: prospect.budgetMax ? Number(prospect.budgetMax) : undefined,
                currency: prospect.currency,
                projectTimeline: prospect.projectTimeline ?? undefined,
                internalNotes: prospect.internalNotes ?? undefined,
                assignedToId: prospect.assignedToId ?? undefined,
              }}
            />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">
          Biens d&apos;intérêt ({prospect.propertyInterests.length})
        </h2>
        <ul className="mt-4 flex flex-col gap-2">
          {prospect.propertyInterests.map((interest) => (
            <li key={interest.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
              <div className="flex flex-col">
                <Link href={`/admin/biens/${interest.property.id}`} className="text-sm font-medium text-anthracite-900 hover:text-gold-600">
                  {interest.property.titleFr}
                </Link>
                <span className="text-xs text-anthracite-400">
                  {interest.property.reference} · {interest.property.city}
                </span>
                {interest.internalNote && <span className="mt-1 text-xs text-anthracite-500">{interest.internalNote}</span>}
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="outline">{interestLevelLabels[interest.interestLevel]}</Badge>
                {canEdit && (
                  <form action={removePropertyInterest.bind(null, prospect.id, interest.property.id)}>
                    <button type="submit" className="text-xs font-medium text-red-600 hover:text-red-500">
                      Retirer
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
          {prospect.propertyInterests.length === 0 && <p className="text-sm text-anthracite-400">Aucun bien d&apos;intérêt pour le moment.</p>}
        </ul>

        {canEdit && (
          <div className="mt-6">
            <PropertyInterestForm
              action={boundUpsertInterest}
              properties={pickerProperties.map((property) => ({ id: property.id, label: property.titleFr, sublabel: `${property.reference} · ${property.city}` }))}
            />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-anthracite-950">Visites ({prospect.visits.length})</h2>
          {canEdit && (
            <Button href={`/admin/visites/nouveau?prospectId=${prospect.id}`} variant="ghost" size="sm" className="border border-anthracite-200 hover:border-gold-500">
              + Planifier une visite
            </Button>
          )}
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {prospect.visits.map((visit) => (
            <li key={visit.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-anthracite-900">{visit.property.titleFr}</span>
                <span className="text-xs text-anthracite-400">
                  {visitTypeLabels[visit.type]} · {formatDateTime(visit.scheduledStart)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="outline">{visitStatusLabels[visit.status]}</Badge>
                <Link href={`/admin/visites/${visit.id}`} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                  Voir
                </Link>
              </div>
            </li>
          ))}
          {prospect.visits.length === 0 && <p className="text-sm text-anthracite-400">Aucune visite planifiée.</p>}
        </ul>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">
          Actions &amp; relances ({openActivities.length} en cours)
        </h2>
        <ul className="mt-4 flex flex-col gap-2">
          {openActivities.map((activity) => (
            <li key={activity.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-anthracite-900">{activity.title}</span>
                <span className="text-xs text-anthracite-400">
                  {activityTypeLabels[activity.type]} {activity.dueAt ? `· échéance ${formatDateTime(activity.dueAt)}` : ""}
                  {activity.assignedTo ? ` · ${activity.assignedTo.name ?? activity.assignedTo.email}` : ""}
                </span>
              </div>
              {canEdit && (
                <div className="flex gap-2">
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
                </div>
              )}
            </li>
          ))}
          {openActivities.length === 0 && <p className="text-sm text-anthracite-400">Aucune action en cours.</p>}
        </ul>

        {closedActivities.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-anthracite-400">
              Historique ({closedActivities.length})
            </summary>
            <ul className="mt-2 flex flex-col gap-2">
              {closedActivities.map((activity) => (
                <li key={activity.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-50 p-3">
                  <span className="text-sm text-anthracite-600">{activity.title}</span>
                  <Badge tone="outline">{activityStatusLabels[activity.status]}</Badge>
                </li>
              ))}
            </ul>
          </details>
        )}

        {canEdit && (
          <div className="mt-6">
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
