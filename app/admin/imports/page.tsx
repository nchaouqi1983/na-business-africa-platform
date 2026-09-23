import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageImports } from "@/lib/admin/import-permissions";
import { listImportBatches } from "@/lib/admin/import-queries";
import { importBatchStatusLabels, importSourceLabels } from "@/lib/admin/import-labels";
import { formatDateTime } from "@/lib/admin/format";
import Badge from "@/components/Badge";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Imports | NA Business Africa",
};

const statusTone: Record<string, "gold" | "anthracite" | "outline"> = {
  BROUILLON: "outline",
  VALIDE: "gold",
  IMPORTE: "anthracite",
  ECHEC: "outline",
};

export default async function ImportsPage() {
  const user = await requireAdminUser();

  if (!canManageImports(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas d&apos;accéder aux imports.</p>
      </div>
    );
  }

  const batches = await listImportBatches();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Imports</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">
            {batches.length} import{batches.length > 1 ? "s" : ""}
          </h1>
          <p className="text-sm text-anthracite-500">
            Import CSV sécurisé, en deux étapes : validation puis création des biens en brouillon.
          </p>
        </div>
        <Button href="/admin/imports/nouveau" size="sm">
          + Nouvel import
        </Button>
      </div>

      {batches.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-anthracite-200 bg-white p-16 text-center">
          <p className="font-display text-lg text-anthracite-900">Aucun import pour le moment.</p>
          <Button href="/admin/imports/nouveau" size="sm">
            Importer un premier CSV
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-anthracite-100 bg-white">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-anthracite-100 text-xs font-semibold uppercase tracking-wider text-anthracite-400">
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Fichier</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Lignes</th>
                <th className="px-4 py-3">Créés / MàJ / Erreurs</th>
                <th className="px-4 py-3">Auteur</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id} className="border-b border-anthracite-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-anthracite-900">{batch.reference}</td>
                  <td className="px-4 py-3 text-anthracite-600">{batch.fileName}</td>
                  <td className="px-4 py-3 text-anthracite-600">{importSourceLabels[batch.source]}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[batch.status] ?? "outline"}>{importBatchStatusLabels[batch.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-anthracite-600">
                    {batch.validCount} valide{batch.validCount > 1 ? "s" : ""} / {batch.rowCount}
                  </td>
                  <td className="px-4 py-3 text-anthracite-600">
                    {batch.createdCount} / {batch.updatedCount} / {batch.errorCount}
                  </td>
                  <td className="px-4 py-3 text-anthracite-600">{batch.createdBy.name ?? batch.createdBy.email}</td>
                  <td className="px-4 py-3 text-anthracite-600">{formatDateTime(batch.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/imports/${batch.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-500">
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
