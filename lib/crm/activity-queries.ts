import "server-only";
import { prisma } from "@/lib/db";
import { Prisma, type ActivityStatus as DbActivityStatus, type ActivityType as DbActivityType } from "@/lib/generated/prisma/client";
import { Role } from "@/lib/generated/prisma/enums";
import { activityAccessWhere } from "@/lib/crm/permissions";

/**
 * Query layer for the Activity (tâches / relances) registry (phase 6G1).
 * Every caller must gate access itself: list queries take `role`/`userId`
 * and apply activityAccessWhere itself, single-row getters return the
 * ownership fields the Server Component must check with
 * canViewActivity/canEditActivity (see lib/crm/permissions.ts).
 */

export type ActivityListFilters = {
  view?: "today" | "overdue" | "done" | "all";
  type?: string;
  assignedToId?: string;
};

const activityListInclude = {
  prospect: { select: { id: true, reference: true, firstName: true, lastName: true, companyName: true } },
  property: { select: { id: true, reference: true, titleFr: true } },
  visit: { select: { id: true, reference: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ActivityInclude;

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

export async function listActivities(role: Role, userId: string, filters: ActivityListFilters) {
  const where: Prisma.ActivityWhereInput = {};

  const accessWhere = activityAccessWhere(role, userId);
  if (accessWhere) Object.assign(where, accessWhere);

  if (filters.type) where.type = filters.type as DbActivityType;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;

  switch (filters.view) {
    case "today":
      where.status = "A_FAIRE";
      where.dueAt = { gte: startOfToday(), lt: startOfTomorrow() };
      break;
    case "overdue":
      where.status = "A_FAIRE";
      where.dueAt = { lt: startOfToday() };
      break;
    case "done":
      where.status = { in: ["TERMINEE", "ANNULEE"] as DbActivityStatus[] };
      break;
    default:
      where.status = "A_FAIRE";
  }

  return prisma.activity.findMany({
    where,
    include: activityListInclude,
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
}

export async function countOverdueActivities(role: Role, userId: string): Promise<number> {
  const where: Prisma.ActivityWhereInput = { status: "A_FAIRE", dueAt: { lt: startOfToday() } };
  const accessWhere = activityAccessWhere(role, userId);
  if (accessWhere) Object.assign(where, accessWhere);
  return prisma.activity.count({ where });
}

export async function getActivityById(id: string) {
  return prisma.activity.findUnique({
    where: { id },
    include: {
      prospect: { select: { id: true, reference: true, firstName: true, lastName: true, companyName: true } },
      property: { select: { id: true, reference: true, titleFr: true } },
      visit: { select: { id: true, reference: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}
