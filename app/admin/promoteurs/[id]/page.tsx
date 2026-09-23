import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import { canManageFinance } from "@/lib/finance/permissions";
import { getPromoterWithPrograms, getPromoterStats } from "@/lib/real-estate-network/promoter-queries";
import { updatePromoter, setPromoterActive } from "@/lib/real-estate-network/promoter-actions";
import { programStatusLabels } from "@/lib/real-estate-network/enum-labels";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import PromoterForm from "../_components/PromoterForm";
import NetworkEntityStats from "../../_components/NetworkEntityStats";

export const metadata: Metadata = {
  title: "Promoteur | NA Business Africa",
};

const errorMessages: Record<string, string> = {
  permission: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
};

export default async function PromoterDetailPage({ params, searchParams }: PageProps<"/admin/promoteurs/[id]">) {
  const user = await requireAdminUser();

  if (!canManageRealEstateNetwork(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas d&apos;accéder à cette fiche.</p>
      </div>
    );
  }

  const { id } = await params;
  const sp = await searchParams;
  const promoter = await getPromoterWithPrograms(id);
  if (!promoter) notFound();

  const stats = await getPromoterStats(promoter.id, canManageFinance(user.role));

  const errorParam = typeof sp.erreur === "string" ? sp.erreur : undefined;
  const errorMessage = errorParam ? errorMessages[errorParam] : undefined;

  const boundUpdate = updatePromoter.bind(null, promoter.id);
  const boundActivate = setPromoterActive.bind(null, promoter.id, true);
  const boundDeactivate = setPromoterActive.bind(null, promoter.id, false);

  return (
    <div className="flex flex-col gap-8">
      {errorMessage && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Promoteur</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">{promoter.companyName}</h1>
          <Badge tone={promoter.isActive ? "gold" : "anthracite"}>{promoter.isActive ? "Actif" : "Inactif"}</Badge>
        </div>
        <form action={promoter.isActive ? boundDeactivate : boundActivate}>
          <Button type="submit" variant={promoter.isActive ? "ghost" : "primary"} size="sm" className={promoter.isActive ? "border border-anthracite-200 hover:border-gold-500" : ""}>
            {promoter.isActive ? "Désactiver" : "Activer"}
          </Button>
        </form>
      </div>

      <NetworkEntityStats stats={stats} propertiesHref={`/admin/biens?promoteur_id=${promoter.id}`} />

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Coordonnées</h2>
        <div className="mt-6">
          <PromoterForm
            action={boundUpdate}
            submitLabel="Enregistrer les modifications"
            defaultValues={{
              companyName: promoter.companyName,
              mainContactName: promoter.mainContactName ?? undefined,
              phone: promoter.phone ?? undefined,
              email: promoter.email ?? undefined,
              website: promoter.website ?? undefined,
              ice: promoter.ice ?? undefined,
              address: promoter.address ?? undefined,
              city: promoter.city ?? undefined,
              internalNotes: promoter.internalNotes ?? undefined,
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-anthracite-950">Programmes ({promoter.programs.length})</h2>
          <Link href="/admin/programmes" className="text-sm font-medium text-gold-600 hover:text-gold-500">
            Voir tous les programmes
          </Link>
        </div>
        {promoter.programs.length === 0 ? (
          <p className="mt-4 text-sm text-anthracite-400">Aucun programme pour ce promoteur.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {promoter.programs.map((program) => (
              <li key={program.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-anthracite-900">{program.name}</span>
                  <span className="text-xs text-anthracite-400">
                    {program.city} · {program._count.lots} lot(s) · {program._count.properties} bien(s) lié(s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="outline">{programStatusLabels[program.status]}</Badge>
                  <Link href={`/admin/programmes/${program.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-500">
                    Voir
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
