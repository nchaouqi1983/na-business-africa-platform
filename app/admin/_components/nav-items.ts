import type { Role } from "@/lib/auth/roles";
import type { NavIconName } from "./NavIcon";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: NavIconName;
  disabled?: boolean;
  /** Omitted = visible to every admin-accessible role. Present = only these roles see the item at all. */
  roles?: Role[];
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

/**
 * Plain string literals, not the generated Prisma `Role` runtime value —
 * this file is imported by a "use client" component tree (AdminSidebarNav),
 * and importing the Prisma client's runtime export there drags Node-only
 * internals into the browser bundle and breaks the build.
 */
const REAL_ESTATE_NETWORK_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

/**
 * Grouped, collapsible sidebar structure (phase 6K). "Ajouter un bien" is
 * deliberately NOT a nav entry — it's the primary action button on
 * /admin/biens itself (see app/admin/biens/page.tsx), never duplicated here.
 * No standalone "Médias" section either — media stays inside each bien's
 * own "Médias" tab (app/admin/biens/[id]).
 */
export const adminNavGroups: AdminNavGroup[] = [
  {
    id: "pilotage",
    label: "Pilotage",
    items: [
      { label: "Tableau de bord", href: "/admin", icon: "dashboard" },
      { label: "Aujourd'hui", href: "/admin/aujourd-hui", icon: "today" },
      { label: "Notifications", href: "/admin/notifications", icon: "bell" },
    ],
  },
  {
    id: "catalogue",
    label: "Catalogue",
    items: [
      { label: "Biens", href: "/admin/biens", icon: "building" },
      { label: "Imports", href: "/admin/imports", icon: "upload", roles: REAL_ESTATE_NETWORK_ROLES },
    ],
  },
  {
    id: "relation-client",
    label: "Relation client",
    items: [
      { label: "Demandes", href: "/admin/demandes", icon: "inbox" },
      { label: "Prospects", href: "/admin/prospects", icon: "users" },
      { label: "Visites", href: "/admin/visites", icon: "calendar" },
      { label: "Opportunités", href: "/admin/opportunites", icon: "target" },
      { label: "Actions & relances", href: "/admin/actions", icon: "flag" },
    ],
  },
  {
    id: "reseau-immobilier",
    label: "Réseau immobilier",
    items: [
      { label: "Propriétaires", href: "/admin/proprietaires", icon: "user", roles: REAL_ESTATE_NETWORK_ROLES },
      { label: "Promoteurs", href: "/admin/promoteurs", icon: "briefcase", roles: REAL_ESTATE_NETWORK_ROLES },
      { label: "Programmes neufs", href: "/admin/programmes", icon: "layers", roles: REAL_ESTATE_NETWORK_ROLES },
      { label: "Intermédiaires", href: "/admin/intermediaires", icon: "handshake", roles: REAL_ESTATE_NETWORK_ROLES },
    ],
  },
  {
    id: "finance-interne",
    label: "Finance interne",
    items: [
      { label: "Mandats", href: "/admin/mandats", icon: "file-text", roles: REAL_ESTATE_NETWORK_ROLES },
      { label: "Commissions", href: "/admin/commissions", icon: "percent", roles: REAL_ESTATE_NETWORK_ROLES },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    items: [{ label: "Paramètres", href: "/admin/parametres", icon: "settings" }],
  },
];
