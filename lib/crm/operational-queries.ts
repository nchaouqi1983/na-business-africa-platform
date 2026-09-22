import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { Role } from "@/lib/generated/prisma/enums";
import {
  prospectOperationalWhere,
  visitOperationalWhere,
  activityOperationalWhere,
  type OperationalScope,
} from "@/lib/crm/permissions";
import { demandeStatusValues } from "@/lib/crm/enum-labels";

/**
 * Query layer for the /admin dashboard and /admin/aujourd-hui screens (phase
 * 6H1) — "what needs attention today". Every list here is already scoped by
 * prospectOperationalWhere/visitOperationalWhere/activityOperationalWhere
 * (lib/crm/permissions.ts), which folds the AGENT/EDITOR/VIEWER ownership
 * rules in automatically and only lets SUPER_ADMIN/ADMIN actually switch
 * `scope`.
 */

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfTomorrow(): Date {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}

const prospectRowSelect = {
  id: true,
  reference: true,
  type: true,
  status: true,
  firstName: true,
  lastName: true,
  companyName: true,
  formOrigin: true,
  createdAt: true,
} satisfies Prisma.ProspectSelect;

const activityRowInclude = {
  prospect: { select: { id: true, reference: true, firstName: true, lastName: true, companyName: true } },
} satisfies Prisma.ActivityInclude;

const visitRowInclude = {
  property: { select: { id: true, reference: true, titleFr: true } },
  prospect: { select: { id: true, reference: true, firstName: true, lastName: true, companyName: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
} satisfies Prisma.VisitInclude;

export type OperationalSnapshot = Awaited<ReturnType<typeof getOperationalSnapshot>>;

export async function getOperationalSnapshot(role: Role, userId: string, scope: OperationalScope) {
  const todayStart = startOfToday();
  const todayEnd = startOfTomorrow();
  const in7Days = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const newDemandesWhere: Prisma.ProspectWhereInput = { status: { in: [...demandeStatusValues] } };
  const prospectScope = prospectOperationalWhere(role, userId, scope);
  if (prospectScope) Object.assign(newDemandesWhere, prospectScope);

  const dueTodayWhere: Prisma.ActivityWhereInput = { status: "A_FAIRE", dueAt: { gte: todayStart, lt: todayEnd } };
  const overdueWhere: Prisma.ActivityWhereInput = { status: "A_FAIRE", dueAt: { lt: todayStart } };
  const activityScope = activityOperationalWhere(role, userId, scope);
  if (activityScope) {
    Object.assign(dueTodayWhere, activityScope);
    Object.assign(overdueWhere, activityScope);
  }

  const visitsTodayWhere: Prisma.VisitWhereInput = { scheduledStart: { gte: todayStart, lt: todayEnd } };
  const visitsNext7Where: Prisma.VisitWhereInput = { scheduledStart: { gte: todayStart, lt: in7Days } };
  const visitScope = visitOperationalWhere(role, userId, scope);
  if (visitScope) {
    Object.assign(visitsTodayWhere, visitScope);
    Object.assign(visitsNext7Where, visitScope);
  }

  const [
    newDemandesCount,
    newDemandes,
    dueTodayCount,
    dueTodayActivities,
    overdueCount,
    overdueActivities,
    visitsTodayCount,
    visitsToday,
    visitsNext7DaysCount,
    visitsNext7Days,
  ] = await Promise.all([
    prisma.prospect.count({ where: newDemandesWhere }),
    prisma.prospect.findMany({ where: newDemandesWhere, select: prospectRowSelect, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.activity.count({ where: dueTodayWhere }),
    prisma.activity.findMany({ where: dueTodayWhere, include: activityRowInclude, orderBy: { dueAt: "asc" }, take: 20 }),
    prisma.activity.count({ where: overdueWhere }),
    prisma.activity.findMany({ where: overdueWhere, include: activityRowInclude, orderBy: { dueAt: "asc" }, take: 20 }),
    prisma.visit.count({ where: visitsTodayWhere }),
    prisma.visit.findMany({ where: visitsTodayWhere, include: visitRowInclude, orderBy: { scheduledStart: "asc" }, take: 20 }),
    prisma.visit.count({ where: visitsNext7Where }),
    prisma.visit.findMany({ where: visitsNext7Where, include: visitRowInclude, orderBy: { scheduledStart: "asc" }, take: 20 }),
  ]);

  return {
    kpis: {
      newDemandes: newDemandesCount,
      dueToday: dueTodayCount,
      overdue: overdueCount,
      visitsToday: visitsTodayCount,
      visitsNext7Days: visitsNext7DaysCount,
    },
    newDemandes,
    dueTodayActivities,
    overdueActivities,
    visitsToday,
    visitsNext7Days,
  };
}

/** Always the current user's own overdue relances, regardless of the mine/team scope toggle — feeds the dashboard's "Mes relances en retard" block. */
export async function getMyOverdueActivities(userId: string) {
  const todayStart = startOfToday();
  return prisma.activity.findMany({
    where: { status: "A_FAIRE", dueAt: { lt: todayStart }, assignedToId: userId },
    include: activityRowInclude,
    orderBy: { dueAt: "asc" },
    take: 20,
  });
}

export type PriorityAction = {
  key: string;
  badge: string;
  title: string;
  sublabel: string;
  href: string;
};

function prospectLabel(prospect: { firstName: string | null; lastName: string | null; companyName: string | null }): string {
  return prospect.companyName || [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || "Prospect sans nom";
}

/**
 * Merges the four operational lists into a single "à traiter maintenant"
 * queue, most urgent first: overdue relances, then today's visits (by start
 * time), then today's relances, then fresh unqualified demandes — capped at 8
 * per the 6H1 brief.
 */
export function buildPriorityActions(snapshot: OperationalSnapshot): PriorityAction[] {
  const actions: PriorityAction[] = [
    ...snapshot.overdueActivities.map((activity) => ({
      key: `activity-${activity.id}`,
      badge: "Relance en retard",
      title: activity.title,
      sublabel: `${prospectLabel(activity.prospect)} · ${activity.prospect.reference}`,
      href: `/admin/prospects/${activity.prospect.id}`,
    })),
    ...snapshot.visitsToday.map((visit) => ({
      key: `visit-${visit.id}`,
      badge: "Visite aujourd'hui",
      title: `${visit.property.titleFr} — ${prospectLabel(visit.prospect)}`,
      sublabel: visit.reference,
      href: `/admin/visites/${visit.id}`,
    })),
    ...snapshot.dueTodayActivities.map((activity) => ({
      key: `activity-${activity.id}`,
      badge: "Relance aujourd'hui",
      title: activity.title,
      sublabel: `${prospectLabel(activity.prospect)} · ${activity.prospect.reference}`,
      href: `/admin/prospects/${activity.prospect.id}`,
    })),
    ...snapshot.newDemandes.map((prospect) => ({
      key: `demande-${prospect.id}`,
      badge: "Nouvelle demande",
      title: prospectLabel(prospect),
      sublabel: prospect.reference,
      href: `/admin/prospects/${prospect.id}`,
    })),
  ];

  return actions.slice(0, 8);
}
