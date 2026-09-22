import type { Role } from "@/lib/auth/roles";

export type AdminNavItem = {
  label: string;
  href: string;
  disabled?: boolean;
  /** Omitted = visible to every admin-accessible role. Present = only these roles see the item at all. */
  roles?: Role[];
};

/**
 * Plain string literals, not the generated Prisma `Role` runtime value —
 * this file is imported by a "use client" component tree (AdminSidebarNav),
 * and importing the Prisma client's runtime export there drags Node-only
 * internals into the browser bundle and breaks the build.
 */
const REAL_ESTATE_NETWORK_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

export const adminNavItems: AdminNavItem[] = [
  { label: "Tableau de bord", href: "/admin" },
  { label: "Biens", href: "/admin/biens" },
  { label: "Ajouter un bien", href: "/admin/biens/nouveau" },
  { label: "Demandes", href: "/admin/demandes" },
  { label: "Prospects", href: "/admin/prospects" },
  { label: "Visites", href: "/admin/visites" },
  { label: "Actions / Relances", href: "/admin/actions" },
  { label: "Propriétaires", href: "/admin/proprietaires", roles: REAL_ESTATE_NETWORK_ROLES },
  { label: "Promoteurs", href: "/admin/promoteurs", roles: REAL_ESTATE_NETWORK_ROLES },
  { label: "Programmes neufs", href: "/admin/programmes", roles: REAL_ESTATE_NETWORK_ROLES },
  { label: "Intermédiaires", href: "/admin/intermediaires", roles: REAL_ESTATE_NETWORK_ROLES },
  { label: "Mandats", href: "/admin/mandats", roles: REAL_ESTATE_NETWORK_ROLES },
  { label: "Commissions", href: "/admin/commissions", roles: REAL_ESTATE_NETWORK_ROLES },
  { label: "Médias", href: "#medias", disabled: true },
  { label: "Paramètres", href: "#parametres", disabled: true },
];
