"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import NavIcon from "./NavIcon";
import type { GlobalSearchResponse } from "@/lib/admin/global-search";

const GROUPS: { key: keyof GlobalSearchResponse; label: string }[] = [
  { key: "biens", label: "Biens" },
  { key: "prospects", label: "Prospects" },
  { key: "proprietaires", label: "Propriétaires" },
  { key: "promoteurs", label: "Promoteurs" },
  { key: "intermediaires", label: "Intermédiaires" },
  { key: "programmes", label: "Programmes neufs" },
];

const EMPTY_RESULTS: GlobalSearchResponse = { biens: [], prospects: [], proprietaires: [], promoteurs: [], intermediaires: [], programmes: [] };

export default function AdminGlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResponse>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  function openSearch() {
    setQuery("");
    setResults(EMPTY_RESULTS);
    setOpen(true);
  }

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      requestId.current += 1; // invalidate any in-flight request without touching state directly in this effect
      return;
    }

    const id = ++requestId.current;
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/admin/search?q=${encodeURIComponent(trimmed)}`, { credentials: "same-origin" })
        .then((res) => (res.ok ? res.json() : EMPTY_RESULTS))
        .then((data: GlobalSearchResponse) => {
          if (id === requestId.current) {
            setResults(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (id === requestId.current) setLoading(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const hasAnyResult = GROUPS.some((group) => results[group.key].length > 0);

  return (
    <>
      <div className="flex items-center border-b border-anthracite-100 bg-white px-4 py-3 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={openSearch}
          className="flex w-full max-w-sm items-center gap-2.5 rounded-full border border-anthracite-200 px-4 py-2 text-sm text-anthracite-400 transition-colors hover:border-gold-400 hover:text-anthracite-600"
        >
          <NavIcon name="search" className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Rechercher…</span>
          <kbd className="rounded-md border border-anthracite-200 bg-anthracite-50 px-1.5 py-0.5 text-[10px] font-semibold text-anthracite-400">
            Ctrl K
          </kbd>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-anthracite-950/40 px-4 pt-[10vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 border-b border-anthracite-100 px-4 py-3">
              <NavIcon name="search" className="h-4 w-4 shrink-0 text-anthracite-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Référence, nom, ville, téléphone…"
                className="flex-1 text-sm text-anthracite-900 outline-none placeholder:text-anthracite-400"
              />
              <button type="button" onClick={() => setOpen(false)} className="text-xs text-anthracite-400 hover:text-anthracite-700">
                Échap
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <p className="px-3 py-6 text-center text-sm text-anthracite-400">Tapez au moins 2 caractères…</p>
              ) : loading ? (
                <p className="px-3 py-6 text-center text-sm text-anthracite-400">Recherche…</p>
              ) : !hasAnyResult ? (
                <p className="px-3 py-6 text-center text-sm text-anthracite-400">Aucun résultat.</p>
              ) : (
                GROUPS.map((group) => {
                  const items = results[group.key];
                  if (items.length === 0) return null;
                  return (
                    <div key={group.key} className="mb-2 flex flex-col gap-0.5">
                      <span className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-anthracite-400">
                        {group.label}
                      </span>
                      {items.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="flex flex-col gap-0.5 rounded-xl px-3 py-2 text-sm hover:bg-anthracite-50"
                        >
                          <span className="font-medium text-anthracite-900">{item.title}</span>
                          <span className="text-xs text-anthracite-500">{item.subtitle}</span>
                        </Link>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
