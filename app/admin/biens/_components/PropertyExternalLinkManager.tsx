"use client";

import { useState } from "react";
import type { PropertyExternalLinkDto } from "@/lib/admin/property-external-link-dto";
import { externalLinkTypeLabels, externalLinkTypeValues, type ExternalLinkTypeValue } from "@/lib/external-links/constants";

type PropertyExternalLinkManagerProps = {
  propertyId: string;
  initialLinks: PropertyExternalLinkDto[];
  canManage: boolean;
  offMarket: boolean;
};

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function PropertyExternalLinkManager({
  propertyId,
  initialLinks,
  canManage,
  offMarket,
}: PropertyExternalLinkManagerProps) {
  const [links, setLinks] = useState<PropertyExternalLinkDto[]>([...initialLinks].sort((a, b) => a.sortOrder - b.sortOrder));
  const [type, setType] = useState<ExternalLinkTypeValue>("VIDEO_YOUTUBE");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"INTERNE" | "PUBLIABLE">("INTERNE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("URL requise.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, url: url.trim(), title: title.trim() || undefined, visibility }),
      });
      const data = (await res.json()) as { link?: PropertyExternalLinkDto; error?: string };
      if (!res.ok || !data.link) {
        setError(data.error ?? "Échec de l'ajout du lien.");
        return;
      }
      setLinks((prev) => [...prev, data.link!].sort((a, b) => a.sortOrder - b.sortOrder));
      setUrl("");
      setTitle("");
      setType("VIDEO_YOUTUBE");
      setVisibility("INTERNE");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(linkId: string) {
    if (!window.confirm("Supprimer ce lien ?")) return;
    const previous = links;
    setLinks((prev) => prev.filter((l) => l.id !== linkId));

    const res = await fetch(`/api/admin/properties/${propertyId}/links/${linkId}`, { method: "DELETE" });
    if (!res.ok) {
      setLinks(previous);
      setError("Impossible de supprimer ce lien.");
    }
  }

  async function persistOrder(next: PropertyExternalLinkDto[]) {
    const res = await fetch(`/api/admin/properties/${propertyId}/links/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((l) => l.id) }),
    });
    if (!res.ok) {
      setError("Impossible d'enregistrer le nouvel ordre.");
      return;
    }
    setLinks(next.map((l, index) => ({ ...l, sortOrder: index })));
  }

  function move(linkId: string, direction: -1 | 1) {
    const index = links.findIndex((l) => l.id === linkId);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= links.length) return;

    const next = [...links];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    const previous = links;
    setLinks(next.map((l, i) => ({ ...l, sortOrder: i })));
    persistOrder(next).catch(() => setLinks(previous));
  }

  async function toggleVisibility(link: PropertyExternalLinkDto) {
    if (offMarket) return;
    const previous = links;
    const nextVisibility = link.visibility === "PUBLIABLE" ? "INTERNE" : "PUBLIABLE";
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, visibility: nextVisibility } : l)));

    const res = await fetch(`/api/admin/properties/${propertyId}/links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: nextVisibility }),
    });
    if (!res.ok) {
      setLinks(previous);
      setError("Impossible de modifier la visibilité.");
    }
  }

  if (!canManage && links.length === 0) {
    return <p className="text-sm text-anthracite-400">Aucun lien externe pour ce bien.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Liens externes</h4>
        <span className="text-xs text-anthracite-500">{links.length} lien(s)</span>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {canManage && (
        <form onSubmit={handleCreate} className="flex flex-col gap-3 rounded-2xl border border-anthracite-100 bg-anthracite-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold uppercase tracking-wider text-anthracite-500">Type</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as ExternalLinkTypeValue)}
                className="rounded-lg border border-anthracite-200 px-2 py-1.5 text-sm outline-none focus:border-gold-500"
              >
                {externalLinkTypeValues.map((value) => (
                  <option key={value} value={value}>
                    {externalLinkTypeLabels[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold uppercase tracking-wider text-anthracite-500">Titre (optionnel)</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                placeholder="Ex. Visite du salon"
                className="rounded-lg border border-anthracite-200 px-2 py-1.5 text-sm outline-none focus:border-gold-500"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold uppercase tracking-wider text-anthracite-500">URL</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://…"
              className="rounded-lg border border-anthracite-200 px-2 py-1.5 text-sm outline-none focus:border-gold-500"
            />
          </label>

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

          <button
            type="submit"
            disabled={submitting}
            className="w-fit rounded-full bg-anthracite-950 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-anthracite-800 disabled:cursor-not-allowed disabled:bg-anthracite-300"
          >
            {submitting ? "Ajout…" : "Ajouter le lien"}
          </button>
        </form>
      )}

      {links.length === 0 ? (
        <p className="text-sm text-anthracite-400">Aucun lien externe pour ce bien.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((link, index) => (
            <li
              key={link.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-anthracite-100 bg-white p-3"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-anthracite-900">
                  {link.title || externalLinkTypeLabels[link.type as ExternalLinkTypeValue] || link.type}
                </span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs text-gold-600 hover:underline"
                >
                  {hostnameOf(link.url)}
                </a>
              </div>
              <div className="flex items-center gap-2">
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => move(link.id, -1)}
                      disabled={index === 0}
                      title="Monter"
                      className="rounded-md px-1.5 py-1 text-xs text-anthracite-500 hover:bg-anthracite-50 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(link.id, 1)}
                      disabled={index === links.length - 1}
                      title="Descendre"
                      className="rounded-md px-1.5 py-1 text-xs text-anthracite-500 hover:bg-anthracite-50 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleVisibility(link)}
                      disabled={offMarket}
                      className="text-xs font-semibold text-gold-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {link.visibility === "PUBLIABLE" ? "Publiable" : "Usage interne"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(link.id)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
