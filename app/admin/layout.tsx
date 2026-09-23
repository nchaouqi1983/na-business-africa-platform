import type { ReactNode } from "react";
import { requireAdminUser } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";
import { roleLabels } from "@/lib/auth/roles";
import { countUnreadNotifications } from "@/lib/crm/notification-queries";
import { hasDemoData } from "@/lib/demo/demo-data";
import AdminSidebar from "./_components/AdminSidebar";
import AdminMobileNav from "./_components/AdminMobileNav";
import AdminGlobalSearch from "./_components/AdminGlobalSearch";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminUser();
  const [unreadNotifications, showDemoBanner] = await Promise.all([countUnreadNotifications(user.id), hasDemoData()]);

  return (
    <div className="flex min-h-screen bg-anthracite-50/40">
      <AdminSidebar user={user} unreadNotifications={unreadNotifications} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav
          userLabel={user.name ?? user.email}
          roleLabel={roleLabels[user.role]}
          role={user.role}
          logoutAction={logout}
          unreadNotifications={unreadNotifications}
        />
        {showDemoBanner && (
          <p className="border-b border-gold-200 bg-gold-200/30 px-4 py-1.5 text-center text-xs text-anthracite-600 sm:px-6 lg:px-10">
            Données de démonstration locales
          </p>
        )}
        <AdminGlobalSearch />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
