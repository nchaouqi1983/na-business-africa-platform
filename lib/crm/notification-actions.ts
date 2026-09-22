"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth/dal";

/**
 * Server Actions behind /admin/notifications and the sidebar badge (phase
 * 6H1). No physical deletion in this phase — see the 6H1 brief — only
 * isRead/readAt ever change.
 */

export async function markNotificationRead(id: string): Promise<void> {
  const user = await requireAdminUser();

  await prisma.notification.updateMany({
    where: { id, userId: user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
  revalidatePath("/admin/aujourd-hui");
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireAdminUser();

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
  revalidatePath("/admin/aujourd-hui");
}
