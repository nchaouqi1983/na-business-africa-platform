"use client";

import { useState, useSyncExternalStore } from "react";

type ShareSaveActionsProps = {
  propertyId: string;
  title: string;
};

const STORAGE_KEY = "na-business-africa:saved-properties";
const listeners = new Set<() => void>();

function readSaved(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeSaved(next: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Stockage local indisponible (mode privé, quota) — l'état reste local à la session en cours.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getServerSnapshot() {
  return false;
}

function useSavedProperty(propertyId: string) {
  return useSyncExternalStore(
    subscribe,
    () => readSaved().includes(propertyId),
    getServerSnapshot
  );
}

function toggleSavedProperty(propertyId: string) {
  const current = readSaved();
  const next = current.includes(propertyId)
    ? current.filter((id) => id !== propertyId)
    : [...current, propertyId];
  writeSaved(next);
}

export default function ShareSaveActions({ propertyId, title }: ShareSaveActionsProps) {
  const saved = useSavedProperty(propertyId);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Partage annulé par l'utilisateur — aucune action nécessaire.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareFeedback("Lien copié");
    } catch {
      setShareFeedback("Copie indisponible");
    }
    window.setTimeout(() => setShareFeedback(null), 2200);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-anthracite-200 text-anthracite-600 transition-colors hover:border-gold-500 hover:text-gold-600"
        aria-label="Partager ce bien"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.5 15.5 8M8.5 11.5 15.5 16" />
          <circle cx="6.5" cy="12" r="2.5" />
          <circle cx="17.5" cy="6.5" r="2.5" />
          <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
        {shareFeedback && (
          <span className="absolute -bottom-8 right-0 whitespace-nowrap rounded-full bg-anthracite-950 px-3 py-1 text-[11px] font-medium text-white">
            {shareFeedback}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => toggleSavedProperty(propertyId)}
        aria-pressed={saved}
        aria-label={saved ? "Retirer des biens enregistrés" : "Enregistrer ce bien"}
        className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
          saved
            ? "border-gold-500 bg-gold-500/10 text-gold-600"
            : "border-anthracite-200 text-anthracite-600 hover:border-gold-500 hover:text-gold-600"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 20.5s-7.5-4.6-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5.5c-2 4.4-9.5 9-9.5 9Z"
          />
        </svg>
      </button>
    </div>
  );
}
