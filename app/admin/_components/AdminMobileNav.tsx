"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLockup from "@/components/Logo";
import Button from "@/components/Button";
import AdminSidebarNav from "./AdminSidebarNav";

type AdminMobileNavProps = {
  userLabel: string;
  roleLabel: string;
  logoutAction: () => void | Promise<void>;
};

export default function AdminMobileNav({ userLabel, roleLabel, logoutAction }: AdminMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-anthracite-100 bg-white px-4 py-3 md:hidden">
      <div className="flex items-center justify-between">
        <Link href="/admin" onClick={() => setOpen(false)}>
          <BrandLockup tagline={false} className="scale-90" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-anthracite-200 text-anthracite-700"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-4 border-t border-anthracite-100 pt-4">
          <AdminSidebarNav onNavigate={() => setOpen(false)} />
          <div className="flex flex-col gap-3 border-t border-anthracite-100 pt-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-anthracite-900">{userLabel}</span>
              <span className="text-xs uppercase tracking-wider text-anthracite-400">{roleLabel}</span>
            </div>
            <Button href="/" variant="ghost" size="sm" className="justify-center border border-anthracite-200">
              Voir le site
            </Button>
            <form action={logoutAction}>
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
        </div>
      )}
    </div>
  );
}
