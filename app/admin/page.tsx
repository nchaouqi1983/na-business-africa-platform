import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/auth/dal";
import { roleLabels } from "@/lib/auth/roles";
import Badge from "@/components/Badge";

export const metadata: Metadata = {
  title: "Tableau de bord | NA Business Africa",
  description: "Tableau de bord de l'administration NA Business Africa.",
};

const upcomingModules = [
  "Import et gestion des biens",
  "Propriétaires, promoteurs et commissions",
  "Photos et médias",
  "Demandes de contact et suivi WhatsApp/e-mail",
];

export default async function AdminPage() {
  const user = await requireAdminUser();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
          Tableau de bord
        </span>
        <h1 className="font-display text-3xl font-semibold text-anthracite-950">
          Bienvenue, {user.name ?? user.email}
        </h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl border border-anthracite-100 p-6">
          <span className="text-sm text-anthracite-500">Compte connecté</span>
          <span className="text-lg font-medium text-anthracite-950">{user.email}</span>
          <Badge tone="anthracite" className="w-fit">
            {roleLabels[user.role]}
          </Badge>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-gold-300 bg-gold-200/30 p-6">
          <span className="text-sm text-anthracite-700">Socle phase 6A</span>
          <p className="text-sm text-anthracite-600">
            Authentification, rôles et audit sont en place. La gestion des biens reste basée sur les
            données fictives publiques et n&apos;est pas encore pilotable depuis cet espace.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-anthracite-100 p-6">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Prochains modules</h2>
        <ul className="mt-4 flex flex-col gap-2 text-sm text-anthracite-600">
          {upcomingModules.map((module) => (
            <li key={module} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500" aria-hidden="true" />
              {module}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
