import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { listActivities } from "@/lib/crm/activity-queries";
import { searchProspectsForVisitPicker } from "@/lib/crm/visit-queries";
import { setActivityStatus } from "@/lib/crm/activity-actions";
import { canEditActivity } from "@/lib/crm/permissions";
import { activityTypeLabels, activityStatusLabels } from "@/lib/crm/enum-labels";
import { formatDateTime } from "@/lib/admin/format";
import Badge from "@/components/Badge";
import ActionsQuickCreateForm from "./_components/ActionsQuickCreateForm";

export const metadata: Metadata = {
  title: "Actions & relances | NA Business Africa",
};

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function prospectLabel(prospect: { firstName: string | null; lastName: string | null; companyName: string | null }): string {
  return prospect.companyName || [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || "Prospect sans nom";
}

const tabs: { key: "today" | "overdue" | "all" | "done"; label: string }[] = [
  { key: "today", label: "À faire aujourd'hui" },
  { key: "overdue", label: "En retard" },
  { key: "all", label: "Toutes les actions à faire" },
  { key: "done", label: "Terminées" },
];

export default async function ActionsPage({ searchParams }: PageProps<"/admin/actions">) {
  const user = await requireAdminUser();
  const sp = await searchParams;

  const rawView = paramValue(sp.vue);
  const view = (["today", "overdue", "all", "done"] as const).includes(rawView as "today" | "overdue" | "all" | "done")
    ? (rawView as "today" | "overdue" | "all" | "done")
    : "today";

  const [activities, prospects] = await Promise.all([
    listActivities(user.role, user.id, { view }),
    searchProspectsForVisitPicker(user.role, user.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Actions &amp; relances</span>
        <h1 className="font-display text-3xl font-semibold text-anthracite-950">Suivi des tâches et relances</h1>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Ajouter une action</h2>
        <div className="mt-4">
          <ActionsQuickCreateForm
            prospects={prospects.map((prospect) => ({ id: prospect.id, label: prospectLabel(prospect), sublabel: prospect.reference }))}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/actions?vue=${tab.key}`}
            className={[
              "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
              view === tab.key ? "bg-anthracite-950 text-white" : "border border-anthracite-200 text-anthracite-600 hover:border-gold-400",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-anthracite-200 bg-white p-16 text-center">
          <p className="font-display text-lg text-anthracite-900">Aucune action dans cette vue.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {activities.map((activity) => {
            const editable = canEditActivity(user.role, user.id, activity);
            return (
              <li key={activity.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-anthracite-100 bg-white p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="outline">{activityTypeLabels[activity.type]}</Badge>
                    <Badge tone={activity.status === "A_FAIRE" ? "gold" : "anthracite"}>{activityStatusLabels[activity.status]}</Badge>
                    {activity.dueAt && <span className="text-xs text-anthracite-500">Échéance : {formatDateTime(activity.dueAt)}</span>}
                  </div>
                  <span className="text-sm font-medium text-anthracite-900">{activity.title}</span>
                  <span className="text-xs text-anthracite-400">
                    {prospectLabel(activity.prospect)} ({activity.prospect.reference})
                    {activity.property ? ` · ${activity.property.titleFr}` : ""}
                    {activity.assignedTo ? ` · ${activity.assignedTo.name ?? activity.assignedTo.email}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {editable && activity.status === "A_FAIRE" && (
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
                  <Link href={`/admin/prospects/${activity.prospect.id}`} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                    Voir le prospect
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
