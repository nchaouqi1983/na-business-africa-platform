"use client";

import { useEffect, useRef, useState } from "react";
import type { PropertyMediaDto } from "@/lib/admin/property-media-dto";
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_ORIGINAL_FILE_BYTES,
  MAX_PHOTOS_PER_PROPERTY,
  MAX_UPLOAD_CONCURRENCY,
} from "@/lib/media/constants";

type QueueStatus = "queued" | "uploading" | "error";

type QueueItem = {
  localId: string;
  file: File;
  status: QueueStatus;
  progress: number;
  error?: string;
};

type PropertyMediaManagerProps = {
  propertyId: string;
  initialMedia: PropertyMediaDto[];
  canUpload: boolean;
};

const MAX_FILE_MB = Math.round(MAX_ORIGINAL_FILE_BYTES / (1024 * 1024));

function formatBytesAsMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function PropertyMediaManager({ propertyId, initialMedia, canUpload }: PropertyMediaManagerProps) {
  const [media, setMedia] = useState<PropertyMediaDto[]>([...initialMedia].sort((a, b) => a.sortOrder - b.sortOrder));
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startedUploadsRef = useRef<Set<string>>(new Set());

  const roomLeft = MAX_PHOTOS_PER_PROPERTY - media.length - queue.filter((q) => q.status !== "error").length;

  function addFiles(fileList: FileList | File[]) {
    setGlobalError(null);
    const files = Array.from(fileList);
    if (files.length === 0) return;

    let room = MAX_PHOTOS_PER_PROPERTY - media.length - queue.filter((q) => q.status !== "error").length;
    if (room <= 0) {
      setGlobalError(`Limite de ${MAX_PHOTOS_PER_PROPERTY} photos atteinte pour ce bien.`);
      return;
    }

    const accepted: File[] = [];
    const rejected: string[] = [];

    for (const file of files) {
      if (room <= 0) {
        rejected.push(`${file.name} (limite de ${MAX_PHOTOS_PER_PROPERTY} atteinte)`);
        continue;
      }
      if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_MIME_TYPES)[number])) {
        rejected.push(`${file.name} (format non supporté)`);
        continue;
      }
      if (file.size > MAX_ORIGINAL_FILE_BYTES) {
        rejected.push(`${file.name} (${formatBytesAsMb(file.size)}, ${MAX_FILE_MB} Mo max)`);
        continue;
      }
      accepted.push(file);
      room -= 1;
    }

    if (rejected.length > 0) {
      const preview = rejected.slice(0, 3).join(", ");
      setGlobalError(`${rejected.length} fichier(s) ignoré(s) : ${preview}${rejected.length > 3 ? "…" : ""}`);
    }

    if (accepted.length > 0) {
      setQueue((prev) => [
        ...prev,
        ...accepted.map((file) => ({ localId: crypto.randomUUID(), file, status: "queued" as const, progress: 0 })),
      ]);
    }
  }

  function startUpload(item: QueueItem) {
    const formData = new FormData();
    formData.append("file", item.file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/admin/properties/${propertyId}/media`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.round((event.loaded / event.total) * 100);
      setQueue((prev) => prev.map((q) => (q.localId === item.localId ? { ...q, progress } : q)));
    };

    xhr.onload = () => {
      startedUploadsRef.current.delete(item.localId);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { media: PropertyMediaDto };
          setMedia((prev) => [...prev, data.media].sort((a, b) => a.sortOrder - b.sortOrder));
          setQueue((prev) => prev.filter((q) => q.localId !== item.localId));
        } catch {
          setQueue((prev) =>
            prev.map((q) => (q.localId === item.localId ? { ...q, status: "error", error: "Réponse invalide du serveur." } : q))
          );
        }
        return;
      }

      let message = "Échec de l'envoi.";
      try {
        const data = JSON.parse(xhr.responseText) as { error?: string };
        if (data.error) message = data.error;
      } catch {
        // keep default message
      }
      setQueue((prev) =>
        prev.map((q) => (q.localId === item.localId ? { ...q, status: "error", progress: 0, error: message } : q))
      );
    };

    xhr.onerror = () => {
      startedUploadsRef.current.delete(item.localId);
      setQueue((prev) =>
        prev.map((q) => (q.localId === item.localId ? { ...q, status: "error", progress: 0, error: "Erreur réseau." } : q))
      );
    };

    xhr.send(formData);
  }

  useEffect(() => {
    const uploadingCount = queue.filter((q) => q.status === "uploading").length;
    const queued = queue.filter((q) => q.status === "queued" && !startedUploadsRef.current.has(q.localId));
    const freeSlots = MAX_UPLOAD_CONCURRENCY - uploadingCount;
    if (freeSlots <= 0 || queued.length === 0) return;

    const toStart = queued.slice(0, freeSlots);

    // Deferred to a macrotask so the queue-status update and the network
    // calls it triggers never run synchronously inside the effect itself —
    // if the effect re-runs first (e.g. a fast-following queue change), the
    // cleanup below cancels this batch before anything is marked "started".
    const timer = setTimeout(() => {
      setQueue((prev) =>
        prev.map((item) =>
          toStart.some((t) => t.localId === item.localId) ? { ...item, status: "uploading", progress: 0, error: undefined } : item
        )
      );
      for (const item of toStart) {
        startedUploadsRef.current.add(item.localId);
        startUpload(item);
      }
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  function retryItem(localId: string) {
    setQueue((prev) => prev.map((q) => (q.localId === localId ? { ...q, status: "queued", progress: 0, error: undefined } : q)));
  }

  function dismissItem(localId: string) {
    startedUploadsRef.current.delete(localId);
    setQueue((prev) => prev.filter((q) => q.localId !== localId));
  }

  async function patchMedia(mediaId: string, body: Record<string, unknown>): Promise<PropertyMediaDto | null> {
    const res = await fetch(`/api/admin/properties/${propertyId}/media/${mediaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { media: PropertyMediaDto };
    return data.media;
  }

  async function setCover(mediaId: string) {
    const previous = media;
    setMedia((prev) => prev.map((m) => ({ ...m, isCover: m.id === mediaId })));
    const updated = await patchMedia(mediaId, { isCover: true });
    if (!updated) {
      setMedia(previous);
      setGlobalError("Impossible de définir l'image principale.");
    }
  }

  async function saveAltText(mediaId: string, altText: string) {
    const previous = media;
    setMedia((prev) => prev.map((m) => (m.id === mediaId ? { ...m, altText } : m)));
    const updated = await patchMedia(mediaId, { altText });
    if (!updated) {
      setMedia(previous);
      setGlobalError("Impossible d'enregistrer le texte alternatif.");
    }
  }

  async function deleteMedia(mediaId: string) {
    if (!window.confirm("Supprimer définitivement cette photo ?")) return;
    const previous = media;
    setMedia((prev) => prev.filter((m) => m.id !== mediaId));

    const res = await fetch(`/api/admin/properties/${propertyId}/media/${mediaId}`, { method: "DELETE" });
    if (!res.ok) {
      setMedia(previous);
      setGlobalError("Impossible de supprimer cette photo.");
    }
  }

  async function persistOrder(next: PropertyMediaDto[]) {
    const res = await fetch(`/api/admin/properties/${propertyId}/media/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((m) => m.id) }),
    });
    if (!res.ok) {
      setGlobalError("Impossible d'enregistrer le nouvel ordre.");
      return;
    }
    setMedia(next.map((m, index) => ({ ...m, sortOrder: index })));
  }

  function move(mediaId: string, direction: -1 | 1) {
    const index = media.findIndex((m) => m.id === mediaId);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= media.length) return;

    const next = [...media];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    const previous = media;
    setMedia(next.map((m, i) => ({ ...m, sortOrder: i })));
    persistOrder(next).catch(() => setMedia(previous));
  }

  if (!canUpload && media.length === 0) {
    return <p className="text-sm text-anthracite-400">Aucune photo pour ce bien.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-anthracite-500">Photos</h3>
        <span className="text-sm text-anthracite-500">
          {media.length} / {MAX_PHOTOS_PER_PROPERTY} photos ajoutées
        </span>
      </div>

      {globalError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {globalError}
        </p>
      )}

      {canUpload && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            addFiles(event.dataTransfer.files);
          }}
          className={[
            "flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
            isDragging ? "border-gold-500 bg-gold-50" : "border-anthracite-200 bg-anthracite-50",
          ].join(" ")}
        >
          <p className="text-sm font-medium text-anthracite-700">
            {media.length === 0
              ? "Glissez-déposez vos photos ici, ou ajoutez-les manuellement."
              : `Glissez-déposez d'autres photos ici (${Math.max(roomLeft, 0)} restantes).`}
          </p>
          <p className="text-xs text-anthracite-400">
            JPEG, PNG ou WebP — {MAX_FILE_MB} Mo maximum par photo, {MAX_PHOTOS_PER_PROPERTY} photos maximum par bien.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={roomLeft <= 0}
            className="rounded-full bg-anthracite-950 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-anthracite-800 disabled:cursor-not-allowed disabled:bg-anthracite-300"
          >
            Ajouter des photos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_IMAGE_MIME_TYPES.join(",")}
            className="hidden"
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      )}

      {queue.length > 0 && (
        <ul className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 p-4">
          {queue.map((item) => (
            <li key={item.localId} className="flex items-center gap-3 text-sm">
              <span className="min-w-0 flex-1 truncate text-anthracite-700">{item.file.name}</span>
              {item.status === "uploading" && (
                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-anthracite-100">
                  <div className="h-full bg-gold-500 transition-all" style={{ width: `${item.progress}%` }} />
                </div>
              )}
              {item.status === "queued" && <span className="text-xs text-anthracite-400">En attente…</span>}
              {item.status === "error" && (
                <>
                  <span className="text-xs text-red-600">{item.error ?? "Erreur"}</span>
                  <button type="button" onClick={() => retryItem(item.localId)} className="text-xs font-semibold text-gold-600 hover:underline">
                    Relancer
                  </button>
                  <button type="button" onClick={() => dismissItem(item.localId)} className="text-xs text-anthracite-400 hover:text-anthracite-700">
                    Retirer
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((item, index) => (
            <MediaCard
              key={item.id}
              media={item}
              canEdit={canUpload}
              isFirst={index === 0}
              isLast={index === media.length - 1}
              onSetCover={() => setCover(item.id)}
              onSaveAlt={(value) => saveAltText(item.id, value)}
              onDelete={() => deleteMedia(item.id)}
              onMoveUp={() => move(item.id, -1)}
              onMoveDown={() => move(item.id, 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MediaCard({
  media,
  canEdit,
  isFirst,
  isLast,
  onSetCover,
  onSaveAlt,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  media: PropertyMediaDto;
  canEdit: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSetCover: () => void;
  onSaveAlt: (value: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [altDraft, setAltDraft] = useState(media.altText ?? "");

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 bg-white p-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-anthracite-50">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin-only, session-gated image route, not a public asset Next can optimize */}
        <img src={media.urls.card} alt={media.altText ?? ""} className="h-full w-full object-cover" />
        {media.isCover && (
          <span className="absolute left-2 top-2 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-anthracite-950">
            Image principale
          </span>
        )}
      </div>

      {canEdit && (
        <>
          <input
            value={altDraft}
            onChange={(event) => setAltDraft(event.target.value)}
            onBlur={() => {
              if (altDraft !== (media.altText ?? "")) onSaveAlt(altDraft);
            }}
            placeholder="Texte alternatif"
            maxLength={300}
            className="rounded-lg border border-anthracite-200 px-2 py-1 text-xs outline-none focus:border-gold-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-1">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={isFirst}
                title="Monter"
                className="rounded-md px-1.5 py-1 text-xs text-anthracite-500 hover:bg-anthracite-50 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={isLast}
                title="Descendre"
                className="rounded-md px-1.5 py-1 text-xs text-anthracite-500 hover:bg-anthracite-50 disabled:opacity-30"
              >
                ↓
              </button>
            </div>
            <div className="flex gap-2">
              {!media.isCover && (
                <button type="button" onClick={onSetCover} className="text-xs font-semibold text-gold-600 hover:underline">
                  Principale
                </button>
              )}
              <button type="button" onClick={onDelete} className="text-xs font-semibold text-red-600 hover:underline">
                Supprimer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
