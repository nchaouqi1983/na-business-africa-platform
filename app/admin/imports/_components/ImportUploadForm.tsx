"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import { uploadAndValidateImportBatch, type UploadImportFormState } from "@/lib/admin/import-actions";
import { importSourceOptions } from "@/lib/admin/import-labels";
import { inputClass } from "@/app/admin/biens/_components/FormField";

export default function ImportUploadForm() {
  const [state, formAction, pending] = useActionState<UploadImportFormState, FormData>(
    uploadAndValidateImportBatch,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Source</span>
        <select name="source" required defaultValue="CAPITAL_PARC" className={inputClass}>
          {importSourceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Fichier CSV</span>
        <input type="file" name="file" accept=".csv,text/csv" required className={inputClass} />
        <span className="text-xs text-anthracite-400">UTF-8, séparateur virgule ou point-virgule, 500 lignes maximum.</span>
      </label>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Analyse en cours…" : "Analyser le fichier"}
      </Button>
    </form>
  );
}
