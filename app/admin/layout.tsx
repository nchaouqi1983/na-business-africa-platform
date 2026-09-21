import type { ReactNode } from "react";
import { requireAdminUser } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";
import { roleLabels } from "@/lib/auth/roles";
import Button from "@/components/Button";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminUser();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-anthracite-100 pb-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
            Back-office
          </span>
          <span className="font-display text-xl font-semibold text-anthracite-950">
            NA Business Africa
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-anthracite-900">{user.name ?? user.email}</span>
            <span className="text-xs uppercase tracking-wider text-anthracite-400">
              {roleLabels[user.role]}
            </span>
          </div>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="border border-anthracite-200 hover:border-gold-500"
            >
              Déconnexion
            </Button>
          </form>
        </div>
      </div>

      {children}
    </div>
  );
}
