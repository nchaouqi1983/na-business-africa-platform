import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/auth/dal";
import { listDemandes } from "@/lib/crm/prospect-queries";
import { canEditProspect, canCreateProspect } from "@/lib/crm/permissions";
import { setProspectStatus } from "@/lib/crm/prospect-actions";
import { prospectTypeLabels, prospectStatusLabels, prospectSourceLabels } from "@/lib/crm/enum-labels";
import { formatDateTime } from "@/lib/admin/format";
import Badge from "@/components/Badge";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Demandes | NA Business Africa",
};

function prospectDisplayName(prospect: { kind: string; firstName: string | null; lastName: string | null; companyName: string | null }): string {
  if (prospect.kind === "SOCIETE" && prospect.companyName) return prospect.companyName;
  return [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || "Prospect sans nom";
}

export default async function DemandesPage() {
  const user = await requireAdminUser();
  const demandes = await listDemandes(user.role, user.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Demandes</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">
            {demandes.length} demande{demandes.length > 1 ? "s" : ""} à qualifier
          </h1>
          <p className="text-sm text-anthracite-500">Nouveaux prospects (statut Nouveau ou À qualifier) en attente de traitement.</p>
        </div>
        {canCreateProspect(user.role) && (
          <Button href="/admin/prospects/nouveau" size="sm">
            + Nouveau prospect
          </Button>
        )}
      </div>

      {demandes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-anthracite-200 bg-white p-16 text-center">
          <p className="font-display text-lg text-anthracite-900">Aucune demande en attente de qualification.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {demandes.map((prospect) => (
            <li key={prospect.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-anthracite-100 bg-white p-5">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold-600">{prospect.reference}</span>
                  <Badge tone="outline">{prospectTypeLabels[prospect.type]}</Badge>
                  <Badge tone="gold">{prospectStatusLabels[prospect.status]}</Badge>
                </div>
                <span className="font-display text-lg font-semibold text-anthracite-950">{prospectDisplayName(prospect)}</span>
                <span className="text-sm text-anthracite-500">
                  {prospect.phone} · {prospectSourceLabels[prospect.source]} · Reçu le {formatDateTime(prospect.createdAt)}
                </span>
                {prospect.assignedTo && (
                  <span className="text-xs text-anthracite-400">Assigné à {prospect.assignedTo.name ?? prospect.assignedTo.email}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canEditProspect(user.role, user.id, prospect) && prospect.status === "NOUVEAU" && (
                  <form action={setProspectStatus.bind(null, prospect.id)}>
                    <input type="hidden" name="status" value="A_QUALIFIER" />
                    <Button type="submit" variant="secondary" size="sm">
                      Marquer à qualifier
                    </Button>
                  </form>
                )}
                {canEditProspect(user.role, user.id, prospect) && (
                  <form action={setProspectStatus.bind(null, prospect.id)}>
                    <input type="hidden" name="status" value="QUALIFIE" />
                    <Button type="submit" variant="secondary" size="sm">
                      Qualifier
                    </Button>
                  </form>
                )}
                <Button href={`/admin/prospects/${prospect.id}`} size="sm">
                  Voir la fiche
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
