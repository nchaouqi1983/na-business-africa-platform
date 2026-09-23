"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/auth/roles";
import { adminNavGroups } from "./nav-items";
import NavIcon from "./NavIcon";

function isItemActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

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

  const visibleGroups = adminNavGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.roles || item.roles.includes(role)) }))
    .filter((group) => group.items.length > 0);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleGroup(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <nav className="flex flex-col gap-4">
      {visibleGroups.map((group) => {
        const isOpen = !collapsed[group.id];

        return (
          <div key={group.id} className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={isOpen}
              className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-anthracite-400 transition-colors hover:text-anthracite-600"
            >
              {group.label}
              <NavIcon
                name="chevron-down"
                className={`h-3.5 w-3.5 transition-transform ${isOpen ? "" : "-rotate-90"}`}
              />
            </button>

            {isOpen && (
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  if (item.disabled) {
                    return (
                      <span
                        key={item.label}
                        className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm text-anthracite-300"
                      >
                        <span className="flex items-center gap-2.5">
                          <NavIcon name={item.icon} className="h-[18px] w-[18px] text-anthracite-200" />
                          {item.label}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-anthracite-200">
                          Bientôt
                        </span>
                      </span>
                    );
                  }

                  const isActive = isItemActive(pathname, item.href);
                  const showBadge = item.href === "/admin/notifications" && unreadNotifications > 0;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={[
                        "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-anthracite-900 text-white"
                          : "text-anthracite-600 hover:bg-anthracite-100 hover:text-anthracite-950",
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-2.5">
                        <NavIcon
                          name={item.icon}
                          className={`h-[18px] w-[18px] ${isActive ? "text-gold-400" : "text-anthracite-400"}`}
                        />
                        {item.label}
                      </span>
                      {showBadge && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1.5 text-[11px] font-semibold text-anthracite-950">
                          {unreadNotifications > 99 ? "99+" : unreadNotifications}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
