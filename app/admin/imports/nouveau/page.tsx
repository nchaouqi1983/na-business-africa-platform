import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageImports } from "@/lib/admin/import-permissions";
import ImportUploadForm from "../_components/ImportUploadForm";
import ImportMappingGuide from "../_components/ImportMappingGuide";

export const metadata: Metadata = {
  title: "Nouvel import | NA Business Africa",
};

export default async function NewImportPage() {
  const user = await requireAdminUser();

  if (!canManageImports(user.role)) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
        <p className="text-sm text-anthracite-500">Votre rôle ne permet pas d&apos;importer des biens.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Nouvel import</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">Importer un CSV de biens</h1>
          <p className="max-w-2xl text-sm text-anthracite-500">
            Étape 1/2 : le fichier est analysé et validé ligne par ligne. Aucun bien n&apos;est créé à cette étape —
            vous pourrez vérifier les lignes valides et les erreurs avant de lancer l&apos;import.
          </p>
        </div>
        <a
          href="/api/admin/imports/modele"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-anthracite-700 px-4 py-2 text-xs font-medium uppercase tracking-wider text-anthracite-900 transition-colors duration-200 hover:border-gold-500 hover:text-gold-600"
        >
          Télécharger le modèle CSV
        </a>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <ImportUploadForm />
      </div>

      <ImportMappingGuide />
    </div>
  );
}
