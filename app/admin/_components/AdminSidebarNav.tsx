"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/auth/roles";
import { adminNavItems } from "./nav-items";

export default function AdminSidebarNav({
  role,
  onNavigate,
  unreadNotifications = 0,
}: {
  role: Role;
  onNavigate?: () => void;
  unreadNotifications?: number;
}) {
  const pathname = usePathname();
  const visibleItems = adminNavItems.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <nav className="flex flex-col gap-1">
      {visibleItems.map((item) => {
        if (item.disabled) {
          return (
            <span
              key={item.label}
              className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm text-anthracite-300"
            >
              {item.label}
              <span className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-200">
                Bientôt
              </span>
            </span>
          );
        }

        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const showBadge = item.href === "/admin/notifications" && unreadNotifications > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={[
              "flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-anthracite-900 text-white"
                : "text-anthracite-600 hover:bg-anthracite-100 hover:text-anthracite-950",
            ].join(" ")}
          >
            {item.label}
            {showBadge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1.5 text-[11px] font-semibold text-anthracite-950">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
