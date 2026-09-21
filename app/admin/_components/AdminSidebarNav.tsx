"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavItems } from "./nav-items";

export default function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {adminNavItems.map((item) => {
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

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={[
              "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-anthracite-900 text-white"
                : "text-anthracite-600 hover:bg-anthracite-100 hover:text-anthracite-950",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
