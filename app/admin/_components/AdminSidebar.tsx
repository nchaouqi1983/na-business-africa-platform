import Link from "next/link";
import BrandLockup from "@/components/Logo";
import Button from "@/components/Button";
import { logout } from "@/lib/auth/actions";
import { roleLabels } from "@/lib/auth/roles";
import type { AuthenticatedUser } from "@/lib/auth/dal";
import AdminSidebarNav from "./AdminSidebarNav";

export default function AdminSidebar({ user }: { user: AuthenticatedUser }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col justify-between border-r border-anthracite-100 bg-white px-6 py-8 md:flex">
      <div className="flex flex-col gap-8">
        <Link href="/admin">
          <BrandLockup tagline={false} />
        </Link>
        <AdminSidebarNav role={user.role} />
      </div>

      <div className="flex flex-col gap-4 border-t border-anthracite-100 pt-6">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-anthracite-900">{user.name ?? user.email}</span>
          <span className="text-xs uppercase tracking-wider text-anthracite-400">
            {roleLabels[user.role]}
          </span>
        </div>
        <Button href="/" variant="ghost" size="sm" className="justify-center border border-anthracite-200">
          Voir le site
        </Button>
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-center border border-anthracite-200 hover:border-gold-500"
          >
            Déconnexion
          </Button>
        </form>
      </div>
    </aside>
  );
}
