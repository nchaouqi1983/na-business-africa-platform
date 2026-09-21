import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { getPropertyKpis } from "@/lib/admin/property-queries";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Tableau de bord | NA Business Africa",
  description: "Tableau de bord de l'administration NA Business Africa.",
};

const upcomingModules = [
  "Propriétaires, promoteurs et commissions",
  "Photos et médias",
  "Demandes de contact et suivi WhatsApp/e-mail",
  "Visites",
];

export default async function AdminPage() {
  const user = await requireAdminUser();
  const kpis = await getPropertyKpis();

  const kpiCards: { label: string; value: number; href: string }[] = [
    { label: "Total biens", value: kpis.total, href: "/admin/biens" },
    { label: "Brouillons", value: kpis.brouillons, href: "/admin/biens?publication=BROUILLON" },
    { label: "Publiés", value: kpis.publies, href: "/admin/biens?publication=PUBLIE" },
    { label: "Off-market", value: kpis.offMarket, href: "/admin/biens?visibilite=OFF_MARKET" },
    { label: "Archivés", value: kpis.archives, href: "/admin/biens?publication=ARCHIVE" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
            Tableau de bord
          </span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">
            Bienvenue, {user.name ?? user.email}
          </h1>
        </div>
        <Button href="/admin/biens/nouveau" size="sm">
          Ajouter un bien
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kpiCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-6 transition-colors hover:border-gold-400"
          >
            <span className="text-sm text-anthracite-500">{card.label}</span>
            <span className="font-display text-3xl font-semibold text-anthracite-950">{card.value}</span>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6">
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
