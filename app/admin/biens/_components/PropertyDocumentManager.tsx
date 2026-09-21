"use client";

import { useState } from "react";
import type { PropertyDocumentDto } from "@/lib/admin/property-document-dto";
import { documentTypeLabels, documentTypeValues, MAX_DOCUMENT_FILE_BYTES, RESTRICTED_DOCUMENT_TYPES, type DocumentTypeValue } from "@/lib/documents/constants";

type PropertyDocumentManagerProps = {
  propertyId: string;
  initialDocuments: PropertyDocumentDto[];
  canManage: boolean;
  canManageRestricted: boolean;
  offMarket: boolean;
};

const MAX_FILE_MB = Math.round(MAX_DOCUMENT_FILE_BYTES / (1024 * 1024));

function formatBytesAsMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function PropertyDocumentManager({
  propertyId,
  initialDocuments,
  canManage,
  canManageRestricted,
  offMarket,
}: PropertyDocumentManagerProps) {
  const [documents, setDocuments] = useState<PropertyDocumentDto[]>(
    [...initialDocuments].sort((a, b) => a.sortOrder - b.sortOrder)
  );
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<DocumentTypeValue>("BROCHURE");
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"INTERNE" | "PUBLIABLE">("INTERNE");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTypes = documentTypeValues.filter(
    (value) => canManageRestricted || !RESTRICTED_DOCUMENT_TYPES.includes(value)
  );

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Sélectionnez un fichier PDF.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    if (file.size > MAX_DOCUMENT_FILE_BYTES) {
      setError(`Fichier trop volumineux (${formatBytesAsMb(file.size)}, ${MAX_FILE_MB} Mo maximum).`);
      return;
    }
    if (!title.trim()) {
      setError("Un titre est requis.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("title", title.trim());
    formData.append("visibility", visibility);

    setUploading(true);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/documents`, { method: "POST", body: formData });
      const data = (await res.json()) as { document?: PropertyDocumentDto; error?: string };
      if (!res.ok || !data.document) {
        setError(data.error ?? "Échec de l'envoi.");
        return;
      }
      setDocuments((prev) => [...prev, data.document!].sort((a, b) => a.sortOrder - b.sortOrder));
      setFile(null);
      setTitle("");
      setType("BROCHURE");
      setVisibility("INTERNE");
      const input = document.getElementById(`doc-file-${propertyId}`) as HTMLInputElement | null;
      if (input) input.value = "";
    } catch {
      setError("Erreur réseau.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(documentId: string) {
    if (!window.confirm("Supprimer définitivement ce document ?")) return;
    const previous = documents;
    setDocuments((prev) => prev.filter((d) => d.id !== documentId));

    const res = await fetch(`/api/admin/properties/${propertyId}/documents/${documentId}`, { method: "DELETE" });
    if (!res.ok) {
      setDocuments(previous);
      setError("Impossible de supprimer ce document.");
    }
  }

  async function persistOrder(next: PropertyDocumentDto[]) {
    const res = await fetch(`/api/admin/properties/${propertyId}/documents/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((d) => d.id) }),
    });
    if (!res.ok) {
      setError("Impossible d'enregistrer le nouvel ordre.");
      return;
    }
    setDocuments(next.map((d, index) => ({ ...d, sortOrder: index })));
  }

  function move(documentId: string, direction: -1 | 1) {
    const index = documents.findIndex((d) => d.id === documentId);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= documents.length) return;

    const next = [...documents];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    const previous = documents;
    setDocuments(next.map((d, i) => ({ ...d, sortOrder: i })));
    persistOrder(next).catch(() => setDocuments(previous));
  }

  if (!canManage && documents.length === 0) {
    return <p className="text-sm text-anthracite-400">Aucun document pour ce bien.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Documents</h4>
        <span className="text-xs text-anthracite-500">{documents.length} document(s)</span>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {canManage && (
        <form onSubmit={handleUpload} className="flex flex-col gap-3 rounded-2xl border border-anthracite-100 bg-anthracite-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold uppercase tracking-wider text-anthracite-500">Type</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as DocumentTypeValue)}
                className="rounded-lg border border-anthracite-200 px-2 py-1.5 text-sm outline-none focus:border-gold-500"
              >
                {availableTypes.map((value) => (
                  <option key={value} value={value}>
                    {documentTypeLabels[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold uppercase tracking-wider text-anthracite-500">Titre</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                placeholder="Ex. Brochure commerciale"
                className="rounded-lg border border-anthracite-200 px-2 py-1.5 text-sm outline-none focus:border-gold-500"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              id={`doc-file-${propertyId}`}
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="text-xs"
            />
            <label className="flex items-center gap-2 text-xs text-anthracite-700">
              <input
                type="checkbox"
                checked={visibility === "PUBLIABLE"}
                disabled={offMarket}
                onChange={(event) => setVisibility(event.target.checked ? "PUBLIABLE" : "INTERNE")}
                className="h-4 w-4 rounded border-anthracite-300"
              />
              Publiable {offMarket && "(désactivé — bien off-market)"}
            </label>
          </div>

          <p className="text-xs text-anthracite-400">PDF uniquement — {MAX_FILE_MB} Mo maximum par fichier.</p>

          <button
            type="submit"
            disabled={uploading}
            className="w-fit rounded-full bg-anthracite-950 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-anthracite-800 disabled:cursor-not-allowed disabled:bg-anthracite-300"
          >
            {uploading ? "Envoi…" : "Ajouter le document"}
          </button>
        </form>
      )}

      {documents.length === 0 ? (
        <p className="text-sm text-anthracite-400">Aucun document pour ce bien.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((doc, index) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-anthracite-100 bg-white p-3"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-anthracite-900">{doc.title}</span>
                <span className="text-xs text-anthracite-400">
                  {documentTypeLabels[doc.type as DocumentTypeValue] ?? doc.type} · {formatBytesAsMb(doc.sizeBytes)} ·{" "}
                  {doc.visibility === "PUBLIABLE" ? "Publiable" : "Usage interne"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => move(doc.id, -1)}
                      disabled={index === 0}
                      title="Monter"
                      className="rounded-md px-1.5 py-1 text-xs text-anthracite-500 hover:bg-anthracite-50 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(doc.id, 1)}
                      disabled={index === documents.length - 1}
                      title="Descendre"
                      className="rounded-md px-1.5 py-1 text-xs text-anthracite-500 hover:bg-anthracite-50 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </>
                )}
                <a
                  href={doc.downloadUrl}
                  className="text-xs font-semibold text-gold-600 hover:underline"
                >
                  Télécharger
                </a>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
