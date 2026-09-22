import "server-only";
import { prisma } from "@/lib/db";
import { Role } from "@/lib/generated/prisma/enums";
import type { NotificationType } from "@/lib/generated/prisma/client";

/**
 * Server-only creators for the internal Notification model (phase 6H1). No
 * e-mail/SMS/WhatsApp/push/calendar — these rows only ever surface inside
 * /admin (badge, /admin/notifications, /admin/aujourd-hui). A cron will call
 * refreshOperationalNotifications() on a schedule once this ships; locally it
 * only runs when a dashboard/aujourd'hui page renders (see the two Server
 * Components that call it).
 *
 * `message` must never carry phone/e-mail/budget/internalNotes/activity
 * content — only reference numbers, enum labels and dates, same rule as
 * AuditLog.metadata elsewhere in lib/crm/*.
 */

type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  prospectId?: string;
  visitId?: string;
  activityId?: string;
};

async function createNotification(input: NotifyInput): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      prospectId: input.prospectId,
      visitId: input.visitId,
      activityId: input.activityId,
    },
  });
}

async function notifyMany(inputs: NotifyInput[]): Promise<void> {
  if (inputs.length === 0) return;
  await prisma.notification.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      prospectId: input.prospectId,
      visitId: input.visitId,
      activityId: input.activityId,
    })),
  });
}

/** A public /contact, /vendre or /off-market submission created a brand-new Prospect (not merged into an existing one). */
export async function notifyNewPublicDemande(prospect: { id: string; reference: string }): Promise<void> {
  const staff = await prisma.user.findMany({
    where: { role: { in: [Role.SUPER_ADMIN, Role.ADMIN] } },
    select: { id: true },
  });
  await notifyMany(
    staff.map((member) => ({
      userId: member.id,
      type: "NOUVELLE_DEMANDE",
      title: "Nouvelle demande",
      message: `Nouvelle demande reçue depuis le site — ${prospect.reference}.`,
      prospectId: prospect.id,
    }))
  );
}

/** A Prospect got a new (non-null) assignedToId, on creation or on a later edit. */
export async function notifyProspectAssigned(prospect: { id: string; reference: string }, assignedToId: string): Promise<void> {
  await createNotification({
    userId: assignedToId,
    type: "PROSPECT_ASSIGNE",
    title: "Prospect assigné",
    message: `Le prospect ${prospect.reference} vous a été assigné.`,
    prospectId: prospect.id,
  });
}

/** A Visit was just planned — notifies its responsible agent regardless of how far out it is. */
export async function notifyVisitCreated(visit: { id: string; reference: string; scheduledStart: Date; assignedToId: string | null }): Promise<void> {
  if (!visit.assignedToId) return;
  await createNotification({
    userId: visit.assignedToId,
    type: "VISITE_A_VENIR",
    title: "Visite planifiée",
    message: `Visite ${visit.reference} programmée le ${formatFr(visit.scheduledStart)}.`,
    visitId: visit.id,
  });
}

/** A Visit's schedule, status or responsible agent changed — never fired when the new status is ANNULEE (see notifyVisitCancelled). */
export async function notifyVisitUpdated(visit: { id: string; reference: string; scheduledStart: Date; assignedToId: string | null }): Promise<void> {
  if (!visit.assignedToId) return;
  await createNotification({
    userId: visit.assignedToId,
    type: "VISITE_MODIFIEE",
    title: "Visite modifiée",
    message: `Visite ${visit.reference} modifiée — le ${formatFr(visit.scheduledStart)}.`,
    visitId: visit.id,
  });
}

/** A Visit's status changed to ANNULEE. */
export async function notifyVisitCancelled(visit: { id: string; reference: string; assignedToId: string | null }): Promise<void> {
  if (!visit.assignedToId) return;
  await createNotification({
    userId: visit.assignedToId,
    type: "VISITE_ANNULEE",
    title: "Visite annulée",
    message: `Visite ${visit.reference} annulée.`,
    visitId: visit.id,
  });
}

/**
 * An Activity (tâche/relance) was just created for a user, already due today
 * or already overdue at the moment of creation. A future-dated or due-less
 * activity is left to refreshOperationalNotifications() once it comes due.
 */
export async function notifyActivityCreated(activity: {
  id: string;
  prospectId: string;
  prospectReference: string;
  assignedToId: string | null;
  dueAt: Date | null;
  status: string;
}): Promise<void> {
  if (!activity.assignedToId || !activity.dueAt || activity.status !== "A_FAIRE") return;

  const now = new Date();
  let type: NotificationType;
  if (activity.dueAt < now) {
    type = "RELANCE_EN_RETARD";
  } else if (isSameDay(activity.dueAt, now)) {
    type = "RELANCE_AUJOURD_HUI";
  } else {
    return;
  }

  await createNotification({
    userId: activity.assignedToId,
    type,
    title: type === "RELANCE_EN_RETARD" ? "Relance en retard" : "Relance aujourd'hui",
    message: `${type === "RELANCE_EN_RETARD" ? "Relance en retard" : "Relance à faire aujourd'hui"} — ${activity.prospectReference}.`,
    prospectId: activity.prospectId,
    activityId: activity.id,
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

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

/**
 * Idempotent: creates the reminder notifications that are due right now
 * (overdue/today relances, visits within 24h) but only for a (userId, type,
 * entityId) triple that doesn't already have a notification row — so calling
 * it again on every dashboard/aujourd'hui render never duplicates anything.
 * A row an agent already read stays read; it isn't recreated until the
 * underlying activity/visit moves into a different bucket (e.g. today ->
 * overdue), which is a genuinely new fact worth re-surfacing.
 *
 * No cron in this local phase (see the 6H1 brief) — this is called directly
 * from the two Server Components that need fresh reminders. A scheduled job
 * calling this on an interval is the documented follow-up for deployment.
 */
export async function refreshOperationalNotifications(): Promise<void> {
  const now = new Date();
  const todayStart = startOfToday();
  const todayEnd = startOfTomorrow();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [dueTodayActivities, overdueActivities, upcomingVisits] = await Promise.all([
    prisma.activity.findMany({
      where: { status: "A_FAIRE", assignedToId: { not: null }, dueAt: { gte: todayStart, lt: todayEnd } },
      select: { id: true, assignedToId: true, prospect: { select: { id: true, reference: true } } },
    }),
    prisma.activity.findMany({
      where: { status: "A_FAIRE", assignedToId: { not: null }, dueAt: { lt: todayStart } },
      select: { id: true, assignedToId: true, prospect: { select: { id: true, reference: true } } },
    }),
    prisma.visit.findMany({
      where: {
        assignedToId: { not: null },
        status: { in: ["PLANIFIEE", "CONFIRMEE"] },
        scheduledStart: { gte: now, lte: in24h },
      },
      select: { id: true, reference: true, scheduledStart: true, assignedToId: true },
    }),
  ]);

  const candidates: NotifyInput[] = [
    ...dueTodayActivities.map((activity) => ({
      userId: activity.assignedToId!,
      type: "RELANCE_AUJOURD_HUI" as NotificationType,
      title: "Relance aujourd'hui",
      message: `Relance à faire aujourd'hui — ${activity.prospect.reference}.`,
      prospectId: activity.prospect.id,
      activityId: activity.id,
    })),
    ...overdueActivities.map((activity) => ({
      userId: activity.assignedToId!,
      type: "RELANCE_EN_RETARD" as NotificationType,
      title: "Relance en retard",
      message: `Relance en retard — ${activity.prospect.reference}.`,
      prospectId: activity.prospect.id,
      activityId: activity.id,
    })),
    ...upcomingVisits.map((visit) => ({
      userId: visit.assignedToId!,
      type: "VISITE_A_VENIR" as NotificationType,
      title: "Visite à venir",
      message: `Visite ${visit.reference} à venir — le ${formatFr(visit.scheduledStart)}.`,
      visitId: visit.id,
    })),
  ];

  if (candidates.length === 0) return;

  const existing = await prisma.notification.findMany({
    where: {
      OR: candidates.map((candidate) => ({
        userId: candidate.userId,
        type: candidate.type,
        ...(candidate.activityId ? { activityId: candidate.activityId } : { visitId: candidate.visitId }),
      })),
    },
    select: { userId: true, type: true, activityId: true, visitId: true },
  });

  const existingKeys = new Set(existing.map((row) => `${row.userId}:${row.type}:${row.activityId ?? row.visitId}`));
  const toCreate = candidates.filter(
    (candidate) => !existingKeys.has(`${candidate.userId}:${candidate.type}:${candidate.activityId ?? candidate.visitId}`)
  );

  await notifyMany(toCreate);
}

function formatFr(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
