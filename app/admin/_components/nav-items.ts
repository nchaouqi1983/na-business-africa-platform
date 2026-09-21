export type AdminNavItem = {
  label: string;
  href: string;
  disabled?: boolean;
};

export const adminNavItems: AdminNavItem[] = [
  { label: "Tableau de bord", href: "/admin" },
  { label: "Biens", href: "/admin/biens" },
  { label: "Ajouter un bien", href: "/admin/biens/nouveau" },
  { label: "Propriétaires", href: "#proprietaires", disabled: true },
  { label: "Demandes", href: "#demandes", disabled: true },
  { label: "Visites", href: "#visites", disabled: true },
  { label: "Médias", href: "#medias", disabled: true },
  { label: "Promoteurs", href: "#promoteurs", disabled: true },
  { label: "Commissions", href: "#commissions", disabled: true },
  { label: "Paramètres", href: "#parametres", disabled: true },
];
