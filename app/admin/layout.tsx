import type { ReactNode } from "react";
import { requireAdminUser } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";
import { roleLabels } from "@/lib/auth/roles";
import AdminSidebar from "./_components/AdminSidebar";
import AdminMobileNav from "./_components/AdminMobileNav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminUser();

  return (
    <div className="flex min-h-screen bg-anthracite-50/40">
      <AdminSidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav
          userLabel={user.name ?? user.email}
          roleLabel={roleLabels[user.role]}
          logoutAction={logout}
        />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
