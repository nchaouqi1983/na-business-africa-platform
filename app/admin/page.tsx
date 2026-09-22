import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { getPropertyKpis } from "@/lib/admin/property-queries";
import { refreshOperationalNotifications } from "@/lib/crm/notification-service";
import { getOperationalSnapshot, buildPriorityActions, getMyOverdueActivities } from "@/lib/crm/operational-queries";
import { formatDateTime } from "@/lib/admin/format";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Tableau de bord | NA Business Africa",
  description: "Tableau de bord de l'administration NA Business Africa.",
};

const upcomingModules = ["Médias", "Paramètres"];

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function prospectLabel(prospect: { firstName: string | null; lastName: string | null; companyName: string | null }): string {
  return prospect.companyName || [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || "Prospect sans nom";
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const user = await requireAdminUser();
  const sp = await searchParams;
  const isAdminRole = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

  const rawVue = paramValue(sp.vue);
  const scope = isAdminRole && rawVue === "mine" ? "mine" : "team";

  await refreshOperationalNotifications();

  const [kpis, snapshot, myOverdueActivities] = await Promise.all([
    getPropertyKpis(),
    getOperationalSnapshot(user.role, user.id, scope),
    getMyOverdueActivities(user.id),
  ]);

  const priorityActions = buildPriorityActions(snapshot);
  const newDemandesWeb = snapshot.newDemandes.filter((prospect) => prospect.formOrigin !== null).slice(0, 8);
  const upcomingVisits = snapshot.visitsNext7Days.slice(0, 8);

  const operationalKpiCards = [
    { label: "Nouvelles demandes", value: snapshot.kpis.newDemandes, href: "/admin/demandes" },
    { label: "Relances aujourd'hui", value: snapshot.kpis.dueToday, href: "/admin/actions?vue=today" },
    { label: "Relances en retard", value: snapshot.kpis.overdue, href: "/admin/actions?vue=overdue" },
    { label: "Visites aujourd'hui", value: snapshot.kpis.visitsToday, href: "/admin/aujourd-hui" },
    { label: "Visites 7 prochains jours", value: snapshot.kpis.visitsNext7Days, href: "/admin/aujourd-hui" },
  ];

  const propertyKpiCards: { label: string; value: number; href: string }[] = [
    { label: "Total biens", value: kpis.total, href: "/admin/biens" },
    { label: "Brouillons", value: kpis.brouillons, href: "/admin/biens?publication=BROUILLON" },
    { label: "Publiés", value: kpis.publies, href: "/admin/biens?publication=PUBLIE" },
    { label: "Off-market", value: kpis.offMarket, href: "/admin/biens?visibilite=OFF_MARKET" },
    { label: "Archivés", value: kpis.archives, href: "/admin/biens?publication=ARCHIVE" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
            Tableau de bord
          </span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">
            Bienvenue, {user.name ?? user.email}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdminRole && (
            <div className="flex gap-2">
              <Link
                href="/admin?vue=mine"
                className={[
                  "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                  scope === "mine" ? "bg-anthracite-950 text-white" : "border border-anthracite-200 text-anthracite-600 hover:border-gold-400",
                ].join(" ")}
              >
                Mes éléments
              </Link>
              <Link
                href="/admin?vue=team"
                className={[
                  "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                  scope === "team" ? "bg-anthracite-950 text-white" : "border border-anthracite-200 text-anthracite-600 hover:border-gold-400",
                ].join(" ")}
              >
                Toute l&apos;équipe
              </Link>
            </div>
          )}
          <Button href="/admin/biens/nouveau" size="sm">
            Ajouter un bien
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {operationalKpiCards.map((card) => (
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

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-anthracite-950">À traiter maintenant</h2>
          <Link href="/admin/aujourd-hui" className="text-xs font-medium text-gold-600 hover:text-gold-500">
            Voir la journée complète
          </Link>
        </div>
        {priorityActions.length === 0 ? (
          <p className="mt-4 text-sm text-anthracite-400">Rien à traiter dans l&apos;immédiat.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {priorityActions.map((action) => (
              <li key={action.key} className="flex items-center justify-between gap-3 rounded-xl border border-anthracite-100 px-4 py-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gold-600">{action.badge}</span>
                  <span className="text-sm font-medium text-anthracite-900">{action.title}</span>
                  <span className="text-xs text-anthracite-400">{action.sublabel}</span>
                </div>
                <Link href={action.href} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                  Ouvrir
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-anthracite-100 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-semibold text-anthracite-950">Nouvelles demandes site web</h2>
            <Link href="/admin/demandes" className="text-xs font-medium text-gold-600 hover:text-gold-500">
              Tout voir
            </Link>
          </div>
          {newDemandesWeb.length === 0 ? (
            <p className="mt-4 text-sm text-anthracite-400">Aucune nouvelle demande via le site.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {newDemandesWeb.map((prospect) => (
                <li key={prospect.id} className="flex items-center justify-between gap-3 rounded-xl border border-anthracite-100 px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-anthracite-900">{prospectLabel(prospect)}</span>
                    <span className="text-xs text-anthracite-400">{prospect.reference} · {formatDateTime(prospect.createdAt)}</span>
                  </div>
                  <Link href={`/admin/prospects/${prospect.id}`} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                    Voir
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-anthracite-100 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-semibold text-anthracite-950">Prochaines visites</h2>
            <Link href="/admin/visites" className="text-xs font-medium text-gold-600 hover:text-gold-500">
              Tout voir
            </Link>
          </div>
          {upcomingVisits.length === 0 ? (
            <p className="mt-4 text-sm text-anthracite-400">Aucune visite programmée sur les 7 prochains jours.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {upcomingVisits.map((visit) => (
                <li key={visit.id} className="flex items-center justify-between gap-3 rounded-xl border border-anthracite-100 px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-anthracite-900">{visit.property.titleFr}</span>
                    <span className="text-xs text-anthracite-400">
                      {prospectLabel(visit.prospect)} · {formatDateTime(visit.scheduledStart)}
                    </span>
                  </div>
                  <Link href={`/admin/visites/${visit.id}`} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                    Voir
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-anthracite-950">Mes relances en retard</h2>
          <Link href="/admin/actions?vue=overdue" className="text-xs font-medium text-gold-600 hover:text-gold-500">
            Tout voir
          </Link>
        </div>
        {myOverdueActivities.length === 0 ? (
          <p className="mt-4 text-sm text-anthracite-400">Aucune relance en retard qui vous soit assignée.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {myOverdueActivities.map((activity) => (
              <li key={activity.id} className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/40 px-4 py-3">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-anthracite-900">{activity.title}</span>
                  <span className="text-xs text-anthracite-400">
                    {prospectLabel(activity.prospect)} ({activity.prospect.reference})
                    {activity.dueAt ? ` · échéance ${formatDateTime(activity.dueAt)}` : ""}
                  </span>
                </div>
                <Link href={`/admin/prospects/${activity.prospect.id}`} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                  Voir
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {propertyKpiCards.map((card) => (
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

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Prochains modules</h2>
        <ul className="mt-4 flex flex-col gap-2 text-sm text-anthracite-600">
          {upcomingModules.map((module) => (
            <li key={module} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500" aria-hidden="true" />
              {module}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
