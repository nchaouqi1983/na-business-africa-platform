import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { refreshOperationalNotifications } from "@/lib/crm/notification-service";
import { getOperationalSnapshot } from "@/lib/crm/operational-queries";
import { getProspectLiteById } from "@/lib/crm/prospect-queries";
import { completeActivityWithFollowUp, createActivity } from "@/lib/crm/activity-actions";
import { canEditActivity, canViewProspect } from "@/lib/crm/permissions";
import { activityTypeLabels } from "@/lib/crm/enum-labels";
import { formatDateTime } from "@/lib/admin/format";
import Badge from "@/components/Badge";
import QuickActivityForm from "@/app/admin/_components/QuickActivityForm";

export const metadata: Metadata = {
  title: "Aujourd'hui | NA Business Africa",
};

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function prospectLabel(prospect: { firstName: string | null; lastName: string | null; companyName: string | null }): string {
  return prospect.companyName || [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || "Prospect sans nom";
}

const errorMessages: Record<string, string> = {
  permission: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
};

export default async function AujourdHuiPage({ searchParams }: PageProps<"/admin/aujourd-hui">) {
  const user = await requireAdminUser();
  const sp = await searchParams;
  const isAdminRole = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

  const rawVue = paramValue(sp.vue);
  const scope = isAdminRole && rawVue === "mine" ? "mine" : isAdminRole ? "team" : "mine";

  await refreshOperationalNotifications();
  const snapshot = await getOperationalSnapshot(user.role, user.id, scope);

  const prochaineProspectId = paramValue(sp.prochaine);
  const prochaineProspect = prochaineProspectId ? await getProspectLiteById(prochaineProspectId) : null;
  const canPromptFollowUp = prochaineProspect && canViewProspect(user.role, user.id, prochaineProspect);

  const erreur = paramValue(sp.erreur);

  const kpiCards = [
    { label: "Nouvelles demandes", value: snapshot.kpis.newDemandes, href: "/admin/demandes" },
    { label: "Relances aujourd'hui", value: snapshot.kpis.dueToday, href: "/admin/actions?vue=today" },
    { label: "Relances en retard", value: snapshot.kpis.overdue, href: "/admin/actions?vue=overdue" },
    { label: "Visites aujourd'hui", value: snapshot.kpis.visitsToday, href: "/admin/visites" },
    { label: "Visites 7 prochains jours", value: snapshot.kpis.visitsNext7Days, href: "/admin/visites" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Aujourd&apos;hui</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">Ce qui doit être traité aujourd&apos;hui</h1>
        </div>
        {isAdminRole && (
          <div className="flex gap-2">
            <Link
              href="/admin/aujourd-hui?vue=mine"
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                scope === "mine" ? "bg-anthracite-950 text-white" : "border border-anthracite-200 text-anthracite-600 hover:border-gold-400",
              ].join(" ")}
            >
              Mes éléments
            </Link>
            <Link
              href="/admin/aujourd-hui?vue=team"
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                scope === "team" ? "bg-anthracite-950 text-white" : "border border-anthracite-200 text-anthracite-600 hover:border-gold-400",
              ].join(" ")}
            >
              Toute l&apos;équipe
            </Link>
          </div>
        )}
      </div>

      {erreur && errorMessages[erreur] && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessages[erreur]}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kpiCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-6 transition-colors hover:border-gold-400"
          >
            <span className="text-sm text-anthracite-500">{card.label}</span>
            <span className="font-display text-3xl font-semibold text-anthracite-950">{card.value}</span>
          </Link>
        ))}
      </div>

      {canPromptFollowUp && prochaineProspect && (
        <div className="rounded-2xl border border-gold-300 bg-gold-50/40 p-6">
          <h2 className="font-display text-lg font-semibold text-anthracite-950">
            Relance terminée pour {prospectLabel(prochaineProspect)} ({prochaineProspect.reference})
          </h2>
          <p className="mt-1 text-sm text-anthracite-600">Créer la prochaine relance pour ce prospect ?</p>
          <div className="mt-4">
            <QuickActivityForm action={createActivity.bind(null, { prospectId: prochaineProspect.id })} />
          </div>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">En retard</h2>
        {snapshot.overdueActivities.length === 0 ? (
          <p className="text-sm text-anthracite-400">Aucune relance en retard.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {snapshot.overdueActivities.map((activity) => {
              const editable = canEditActivity(user.role, user.id, activity);
              return (
                <li key={activity.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/40 p-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="outline">{activityTypeLabels[activity.type]}</Badge>
                      {activity.dueAt && <span className="text-xs text-red-700">Échéance : {formatDateTime(activity.dueAt)}</span>}
                    </div>
                    <span className="text-sm font-medium text-anthracite-900">{activity.title}</span>
                    <span className="text-xs text-anthracite-400">
                      {prospectLabel(activity.prospect)} ({activity.prospect.reference})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {editable && (
                      <form action={completeActivityWithFollowUp.bind(null, activity.id, activity.prospect.id)}>
                        <button type="submit" className="text-xs font-medium text-green-700 hover:text-green-600">
                          Terminer
                        </button>
                      </form>
                    )}
                    <Link href={`/admin/prospects/${activity.prospect.id}`} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                      Voir le prospect
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">À faire aujourd&apos;hui</h2>
        {snapshot.dueTodayActivities.length === 0 ? (
          <p className="text-sm text-anthracite-400">Aucune relance à faire aujourd&apos;hui.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {snapshot.dueTodayActivities.map((activity) => {
              const editable = canEditActivity(user.role, user.id, activity);
              return (
                <li key={activity.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-anthracite-100 bg-white p-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="outline">{activityTypeLabels[activity.type]}</Badge>
                      {activity.dueAt && <span className="text-xs text-anthracite-500">Échéance : {formatDateTime(activity.dueAt)}</span>}
                    </div>
                    <span className="text-sm font-medium text-anthracite-900">{activity.title}</span>
                    <span className="text-xs text-anthracite-400">
                      {prospectLabel(activity.prospect)} ({activity.prospect.reference})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {editable && (
                      <form action={completeActivityWithFollowUp.bind(null, activity.id, activity.prospect.id)}>
                        <button type="submit" className="text-xs font-medium text-green-700 hover:text-green-600">
                          Terminer
                        </button>
                      </form>
                    )}
                    <Link href={`/admin/prospects/${activity.prospect.id}`} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                      Voir le prospect
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Visites aujourd&apos;hui</h2>
        {snapshot.visitsToday.length === 0 ? (
          <p className="text-sm text-anthracite-400">Aucune visite aujourd&apos;hui.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {snapshot.visitsToday.map((visit) => (
              <li key={visit.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-anthracite-100 bg-white p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-anthracite-500">{formatDateTime(visit.scheduledStart)}</span>
                  <span className="text-sm font-medium text-anthracite-900">{visit.property.titleFr}</span>
                  <span className="text-xs text-anthracite-400">
                    {prospectLabel(visit.prospect)} ({visit.prospect.reference}) · {visit.reference}
                  </span>
                </div>
                <Link href={`/admin/visites/${visit.id}`} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                  Voir la visite
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Nouvelles demandes</h2>
        {snapshot.newDemandes.length === 0 ? (
          <p className="text-sm text-anthracite-400">Aucune nouvelle demande.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {snapshot.newDemandes.map((prospect) => (
              <li key={prospect.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-anthracite-100 bg-white p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-anthracite-500">{formatDateTime(prospect.createdAt)}</span>
                  <span className="text-sm font-medium text-anthracite-900">{prospectLabel(prospect)}</span>
                  <span className="text-xs text-anthracite-400">{prospect.reference}</span>
                </div>
                <Link href={`/admin/prospects/${prospect.id}`} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                  Voir le prospect
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Prochaines 7 jours</h2>
        {snapshot.visitsNext7Days.length === 0 ? (
          <p className="text-sm text-anthracite-400">Aucune visite programmée sur les 7 prochains jours.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {snapshot.visitsNext7Days.map((visit) => (
              <li key={visit.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-anthracite-100 bg-white p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-anthracite-500">{formatDateTime(visit.scheduledStart)}</span>
                  <span className="text-sm font-medium text-anthracite-900">{visit.property.titleFr}</span>
                  <span className="text-xs text-anthracite-400">
                    {prospectLabel(visit.prospect)} ({visit.prospect.reference}) · {visit.reference}
                  </span>
                </div>
                <Link href={`/admin/visites/${visit.id}`} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                  Voir la visite
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
