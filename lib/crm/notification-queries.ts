import "server-only";
import { prisma } from "@/lib/db";

/**
 * Query layer for the Notification centre (phase 6H1). Every notification
 * row already carries its own userId — unlike Prospect/Visit/Activity there
 * is no role-based ownership check to apply, a user only ever queries their
 * own notifications (see requireAdminUser() callers in
 * lib/crm/notification-actions.ts and the /admin/notifications page).
 */

const notificationListInclude = {
  prospect: { select: { id: true, reference: true } },
  visit: { select: { id: true, reference: true } },
  activity: { select: { id: true } },
} as const;

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    include: notificationListInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}
