import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { listNotifications } from "@/lib/crm/notification-queries";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/crm/notification-actions";
import { notificationTypeLabels } from "@/lib/crm/enum-labels";
import { formatDateTime } from "@/lib/admin/format";
import Badge from "@/components/Badge";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Notifications | NA Business Africa",
};

function notificationHref(notification: { prospectId: string | null; visitId: string | null; opportunityId: string | null }): string | null {
  if (notification.opportunityId) return `/admin/opportunites/${notification.opportunityId}`;
  if (notification.visitId) return `/admin/visites/${notification.visitId}`;
  if (notification.prospectId) return `/admin/prospects/${notification.prospectId}`;
  return null;
}

export default async function NotificationsPage() {
  const user = await requireAdminUser();
  const notifications = await listNotifications(user.id);
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Notifications</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">
            {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}` : "Aucune notification non lue"}
          </h1>
        </div>
        {unreadCount > 0 && (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="secondary" size="sm">
              Tout marquer lu
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-anthracite-200 bg-white p-16 text-center">
          <p className="font-display text-lg text-anthracite-900">Aucune notification pour l&apos;instant.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((notification) => {
            const href = notificationHref(notification);
            return (
              <li
                key={notification.id}
                className={[
                  "flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4",
                  notification.isRead ? "border-anthracite-100 bg-white" : "border-gold-300 bg-gold-50/40",
                ].join(" ")}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={notification.isRead ? "outline" : "gold"}>{notificationTypeLabels[notification.type]}</Badge>
                    <span className="text-xs text-anthracite-400">{formatDateTime(notification.createdAt)}</span>
                  </div>
                  <span className="text-sm font-medium text-anthracite-900">{notification.title}</span>
                  <span className="text-xs text-anthracite-500">{notification.message}</span>
                </div>
                <div className="flex items-center gap-3">
                  {!notification.isRead && (
                    <form action={markNotificationRead.bind(null, notification.id)}>
                      <button type="submit" className="text-xs font-medium text-gold-600 hover:text-gold-500">
                        Marquer lu
                      </button>
                    </form>
                  )}
                  {href && (
                    <Link href={href} className="text-xs font-medium text-anthracite-600 hover:text-anthracite-950">
                      Voir la fiche
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
