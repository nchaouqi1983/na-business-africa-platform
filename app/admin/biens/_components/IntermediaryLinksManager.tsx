"use client";

import { useMemo, useState, useTransition } from "react";
import {
  addPropertyIntermediaryLink,
  removePropertyIntermediaryLink,
  type RelationFormState,
} from "@/lib/real-estate-network/property-links-actions";
import { createIntermediary, type IntermediaryFormState } from "@/lib/real-estate-network/intermediary-actions";
import { intermediaryTypeOptions, partyKindOptions } from "@/lib/real-estate-network/enum-labels";
import { inputClass } from "./FormField";

export type IntermediaryPickerOption = { id: string; nameOrCompany: string; type: string; city: string | null };

export type PropertyIntermediaryLinkDto = {
  id: string;
  intermediaryId: string;
  role: string | null;
  note: string | null;
  intermediary: { id: string; nameOrCompany: string; type: string; city: string | null };
};

type Props = {
  propertyId: string;
  initialLinks: PropertyIntermediaryLinkDto[];
  pickerIntermediaries: IntermediaryPickerOption[];
};

export default function IntermediaryLinksManager({ propertyId, initialLinks, pickerIntermediaries }: Props) {
  const [links, setLinks] = useState(initialLinks);
  const [intermediaries, setIntermediaries] = useState(pickerIntermediaries);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [note, setNote] = useState("");
  const [quickKind, setQuickKind] = useState<"PHYSIQUE" | "SOCIETE">("SOCIETE");
  const [quickName, setQuickName] = useState("");
  const [quickType, setQuickType] = useState<string>("AUTRE");
  const [addState, setAddState] = useState<RelationFormState | IntermediaryFormState>(undefined);
  const [pending, startTransition] = useTransition();

  const linkedIds = new Set(links.map((link) => link.intermediaryId));
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return intermediaries.filter(
      (item) => !linkedIds.has(item.id) && (!needle || item.nameOrCompany.toLowerCase().includes(needle))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intermediaries, search, links]);

  function link(intermediaryId: string, fallbackType?: string) {
    const formData = new FormData();
    formData.set("intermediaryId", intermediaryId);
    if (role) formData.set("role", role);
    if (note) formData.set("note", note);

    startTransition(async () => {
      const result = await addPropertyIntermediaryLink(propertyId, undefined, formData);
      setAddState(result);
      if (!result?.error) {
        const item = intermediaries.find((candidate) => candidate.id === intermediaryId);
        if (item) {
          setLinks((prev) => [
            ...prev,
            { id: `${intermediaryId}-pending`, intermediaryId, role: role || null, note: note || null, intermediary: item },
          ]);
        } else if (fallbackType) {
          setLinks((prev) => [
            ...prev,
            {
              id: `${intermediaryId}-pending`,
              intermediaryId,
              role: role || null,
              note: note || null,
              intermediary: { id: intermediaryId, nameOrCompany: quickName, type: fallbackType, city: null },
            },
          ]);
        }
        setRole("");
        setNote("");
        setSearch("");
      }
    });
  }

  function handleQuickCreate() {
    if (!quickName.trim()) return;
    const createFormData = new FormData();
    createFormData.set("kind", quickKind);
    createFormData.set("nameOrCompany", quickName);
    createFormData.set("type", quickType);

    startTransition(async () => {
      const created = await createIntermediary(undefined, createFormData);
      if (!created?.intermediary) {
        setAddState(created);
        return;
      }
      setIntermediaries((prev) => [...prev, { id: created.intermediary!.id, nameOrCompany: created.intermediary!.nameOrCompany, type: quickType, city: null }]);
      link(created.intermediary.id, quickType);
      setQuickName("");
    });
  }

  function remove(linkId: string) {
    if (!window.confirm("Retirer cet intermédiaire de ce bien ?")) return;
    setLinks((prev) => prev.filter((link) => link.id !== linkId));
    startTransition(() => removePropertyIntermediaryLink(linkId));
  }

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Intermédiaires</h4>

      {links.length === 0 ? (
        <p className="text-sm text-anthracite-400">Aucun intermédiaire rattaché.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((link) => (
            <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 bg-white p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-anthracite-900">{link.intermediary.nameOrCompany}</span>
                <span className="text-xs text-anthracite-400">
                  {intermediaryTypeOptions.find((option) => option.value === link.intermediary.type)?.label ?? link.intermediary.type}
                  {link.role ? ` · Rôle: ${intermediaryTypeOptions.find((option) => option.value === link.role)?.label ?? link.role}` : ""}
                </span>
              </div>
              <button type="button" onClick={() => remove(link.id)} className="text-xs font-semibold text-red-600 hover:underline">
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}

      {addState?.error && <p className="text-xs text-red-600">{addState.error}</p>}

      <details className="rounded-2xl border border-dashed border-anthracite-200 p-4">
        <summary className="cursor-pointer text-sm font-medium text-anthracite-700">+ Rattacher un intermédiaire</summary>
        <div className="mt-3 flex flex-col gap-3">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un intermédiaire…"
            className={inputClass}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <select value={role} onChange={(event) => setRole(event.target.value)} className={inputClass}>
              <option value="">Rôle sur ce bien (optionnel)</option>
              {intermediaryTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input type="text" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note (optionnel)" className={inputClass} />
          </div>

          {filtered.length > 0 ? (
            <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => link(item.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-anthracite-200 px-3 py-2 text-left text-sm transition-colors hover:border-gold-300"
                  >
                    <span>{item.nameOrCompany}</span>
                    <span className="text-xs text-anthracite-400">{item.city ?? ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl border border-anthracite-100 bg-anthracite-50 p-3">
              <p className="text-xs text-anthracite-500">Aucun intermédiaire ne correspond — créer rapidement :</p>
              <div className="flex flex-wrap items-end gap-2">
                <select value={quickKind} onChange={(event) => setQuickKind(event.target.value as "PHYSIQUE" | "SOCIETE")} className={inputClass}>
                  {partyKindOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={quickName}
                  onChange={(event) => setQuickName(event.target.value)}
                  placeholder="Nom / raison sociale"
                  className={inputClass}
                />
                <select value={quickType} onChange={(event) => setQuickType(event.target.value)} className={inputClass}>
                  {intermediaryTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleQuickCreate}
                  className="rounded-full bg-anthracite-950 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-anthracite-800 disabled:cursor-not-allowed disabled:bg-anthracite-300"
                >
                  Créer et rattacher
                </button>
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
