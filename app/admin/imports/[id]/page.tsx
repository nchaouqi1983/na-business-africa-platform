import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageImports } from "@/lib/admin/import-permissions";
import { getImportBatch, listImportRows, type ImportRowFilter } from "@/lib/admin/import-queries";
import { importBatchStatusLabels, importRowStatusLabels, importSourceLabels } from "@/lib/admin/import-labels";
import { runImportBatch } from "@/lib/admin/import-actions";
import { formatDateTime } from "@/lib/admin/format";
import Badge from "@/components/Badge";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Détail de l'import | NA Business Africa",
};

const statusTone: Record<string, "gold" | "anthracite" | "outline"> = {
  BROUILLON: "outline",
  VALIDE: "gold",
  IMPORTE: "anthracite",
  ECHEC: "outline",
};

const rowStatusTone: Record<string, "gold" | "anthracite" | "outline"> = {
  VALIDE: "gold",
  ERREUR: "outline",
  IGNORE: "outline",
  IMPORTE: "anthracite",
};

const errorMessages: Record<string, string> = {
  permission: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
  "deja-importe": "Cet import a déjà été lancé — il ne peut pas être relancé une seconde fois.",
};

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

const filterTabs: { value: ImportRowFilter; label: string }[] = [
  { value: "tous", label: "Toutes les lignes" },
  { value: "valides", label: "Valides" },
  { value: "erreurs", label: "Erreurs" },
  { value: "importees", label: "Importées" },
];

function sourceField(sourceData: unknown, key: string): string {
  if (!sourceData || typeof sourceData !== "object") return "—";
  const value = (sourceData as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() !== "" ? value : "—";
}

function hasCoordinates(sourceData: unknown): boolean {
  return sourceField(sourceData, "latitude") !== "—" && sourceField(sourceData, "longitude") !== "—";
}

function imageUrlCount(sourceData: unknown): number {
  const raw = sourceField(sourceData, "image_urls");
  if (raw === "—") return 0;
  return raw.split("|").map((u) => u.trim()).filter(Boolean).length;
}

export default async function ImportDetailPage({
  params,
  searchParams,
}: PageProps<"/admin/imports/[id]">) {
  const user = await requireAdminUser();
  const { id } = await params;
  const sp = await searchParams;

  if (!canManageImports(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas d&apos;accéder aux imports.</p>
      </div>
    );
  }

  const batch = await getImportBatch(id);
  if (!batch) notFound();

  const errorParam = paramValue(sp.erreur);
  const errorMessage = errorParam ? errorMessages[errorParam] : undefined;

  const filterParam = paramValue(sp.filtre);
  const filter: ImportRowFilter = filterTabs.some((tab) => tab.value === filterParam) ? (filterParam as ImportRowFilter) : "tous";
  const page = Number(paramValue(sp.page)) || 1;

  const { rows, total, pageCount } = await listImportRows(id, filter, page);

  function buildHref(overrides: Record<string, string>): string {
    const params = new URLSearchParams({
      ...(filter !== "tous" ? { filtre: filter } : {}),
      ...(page !== 1 ? { page: String(page) } : {}),
      ...overrides,
    });
    const query = params.toString();
    return query ? `/admin/imports/${id}?${query}` : `/admin/imports/${id}`;
  }

  const boundImport = runImportBatch.bind(null, id);
  const canImport = batch.status === "VALIDE" && batch.validCount > 0;

  return (
    <div className="flex flex-col gap-8">
      {errorMessage && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">{batch.reference}</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">{batch.fileName}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[batch.status] ?? "outline"}>{importBatchStatusLabels[batch.status]}</Badge>
            <Badge tone="outline">{importSourceLabels[batch.source]}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {canImport && (
            <form action={boundImport}>
              <Button type="submit" size="sm">
                Importer les {batch.validCount} ligne{batch.validCount > 1 ? "s" : ""} valide{batch.validCount > 1 ? "s" : ""}
              </Button>
            </form>
          )}
          <Link
            href="/admin/imports/nouveau"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-anthracite-700 px-4 py-2 text-xs font-medium uppercase tracking-wider text-anthracite-900 transition-colors duration-200 hover:border-gold-500 hover:text-gold-600"
          >
            Nouvel import
          </Link>
        </div>
      </div>

      {batch.status === "ECHEC" && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Aucune ligne valide dans ce fichier. Corrigez le CSV puis relancez un nouvel import — les lignes de ce
          batch ne peuvent pas être éditées ici.
        </p>
      )}

      <div className="grid gap-4 rounded-2xl border border-anthracite-100 bg-white p-6 sm:grid-cols-3 lg:grid-cols-6">
        <Info label="Lignes" value={String(batch.rowCount)} />
        <Info label="Valides" value={String(batch.validCount)} />
        <Info label="Erreurs" value={String(batch.errorCount)} />
        <Info label="Créés" value={String(batch.createdCount)} />
        <Info label="Mis à jour" value={String(batch.updatedCount)} />
        <Info label="Auteur" value={batch.createdBy.name ?? batch.createdBy.email} />
        <Info label="Coordonnées valides" value={String(batch.coordinatesValidCount)} />
        <Info label="Images téléchargées" value={String(batch.imagesDownloadedCount)} />
        <Info label="Images rejetées" value={String(batch.imagesRejectedCount)} />
      </div>

      {Array.isArray(batch.ignoredColumns) && batch.ignoredColumns.length > 0 && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Colonnes ignorées (hors du modèle CSV, jamais lues) :{" "}
          {(batch.ignoredColumns as unknown[]).map(String).join(", ")}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs text-anthracite-500">
        <span>Importé le {batch.createdAt ? formatDateTime(batch.createdAt) : "—"}</span>
        {batch.importedAt && <span>· Lancé le {formatDateTime(batch.importedAt)}</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <Link
            key={tab.value}
            href={buildHref({ filtre: tab.value, page: "1" })}
            className={[
              "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
              filter === tab.value ? "bg-anthracite-900 text-white" : "border border-anthracite-200 text-anthracite-600 hover:border-gold-400",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-anthracite-200 bg-white p-16 text-center">
          <p className="font-display text-lg text-anthracite-900">Aucune ligne pour ce filtre.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-anthracite-100 bg-white">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead>
              <tr className="border-b border-anthracite-100 text-xs font-semibold uppercase tracking-wider text-anthracite-400">
                <th className="px-4 py-3">Ligne</th>
                <th className="px-4 py-3">source_external_id</th>
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Coords.</th>
                <th className="px-4 py-3">Images</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Détail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-anthracite-50 last:border-0 align-top">
                  <td className="px-4 py-3 font-medium text-anthracite-900">{row.lineNumber}</td>
                  <td className="px-4 py-3 text-anthracite-600">{sourceField(row.sourceData, "source_external_id")}</td>
                  <td className="px-4 py-3 text-anthracite-600">{sourceField(row.sourceData, "titre")}</td>
                  <td className="px-4 py-3 text-anthracite-600">{sourceField(row.sourceData, "ville")}</td>
                  <td className="px-4 py-3 text-anthracite-600">{hasCoordinates(row.sourceData) ? "✓" : "—"}</td>
                  <td className="px-4 py-3 text-anthracite-600">
                    {row.imagesImportedCount} / {imageUrlCount(row.sourceData)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={rowStatusTone[row.status] ?? "outline"}>{importRowStatusLabels[row.status]}</Badge>
                    {row.status === "IMPORTE" && (
                      <span className="mt-1 block text-xs text-anthracite-400">{row.isUpdate ? "Mise à jour" : "Créé"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-anthracite-600">
                    {row.property && (
                      <Link href={`/admin/biens/${row.property.id}`} className="mb-1 block font-semibold text-gold-600 hover:text-gold-500">
                        {row.property.reference}
                      </Link>
                    )}
                    {Array.isArray(row.errors) && row.errors.length > 0 && (
                      <ul className="flex flex-col gap-0.5 text-red-600">
                        {(row.errors as unknown[]).map((message, index) => (
                          <li key={`e-${index}`}>{String(message)}</li>
                        ))}
                      </ul>
                    )}
                    {Array.isArray(row.imageErrors) && row.imageErrors.length > 0 && (
                      <ul className="mt-1 flex flex-col gap-0.5 text-amber-700">
                        {(row.imageErrors as unknown[]).map((message, index) => (
                          <li key={`i-${index}`}>{String(message)}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <Link
              key={pageNumber}
              href={buildHref({ page: String(pageNumber) })}
              className={[
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
                pageNumber === page ? "bg-anthracite-900 text-white" : "border border-anthracite-200 text-anthracite-600 hover:border-gold-400",
              ].join(" ")}
            >
              {pageNumber}
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-anthracite-400">{total} ligne{total > 1 ? "s" : ""} pour ce filtre.</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-400">{label}</span>
      <span className="text-sm font-medium text-anthracite-900">{value}</span>
    </div>
  );
}
