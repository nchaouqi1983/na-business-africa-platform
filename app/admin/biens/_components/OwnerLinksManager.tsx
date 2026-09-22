"use client";

import { useMemo, useState, useTransition } from "react";
import {
  addPropertyOwnerLink,
  removePropertyOwnerLink,
  type RelationFormState,
} from "@/lib/real-estate-network/property-links-actions";
import { createOwnerQuick, type OwnerFormState } from "@/lib/real-estate-network/owner-actions";
import { propertyOwnerRoleOptions, partyKindOptions } from "@/lib/real-estate-network/enum-labels";
import { inputClass } from "./FormField";

export type OwnerPickerOption = { id: string; fullNameOrCompany: string; kind: "PHYSIQUE" | "SOCIETE"; city: string | null };

export type PropertyOwnerLinkDto = {
  id: string;
  ownerId: string;
  role: string;
  quoteShare: number | null;
  isMainContact: boolean;
  owner: { id: string; fullNameOrCompany: string; kind: "PHYSIQUE" | "SOCIETE"; city: string | null };
};

export type LegacyOwnerInfo = { ownerName: string | null; ownerPhone: string | null; ownerEmail: string | null };

type Props = {
  propertyId: string;
  initialLinks: PropertyOwnerLinkDto[];
  pickerOwners: OwnerPickerOption[];
  legacyOwnerInfo?: LegacyOwnerInfo | null;
};

export default function OwnerLinksManager({ propertyId, initialLinks, pickerOwners, legacyOwnerInfo }: Props) {
  const [links, setLinks] = useState(initialLinks);
  const [owners, setOwners] = useState(pickerOwners);
  const [search, setSearch] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [role, setRole] = useState<string>("PROPRIETAIRE");
  const [quoteShare, setQuoteShare] = useState("");
  const [isMainContact, setIsMainContact] = useState(false);
  const [quickKind, setQuickKind] = useState<"PHYSIQUE" | "SOCIETE">("PHYSIQUE");
  const [quickName, setQuickName] = useState("");
  const [addState, setAddState] = useState<RelationFormState | OwnerFormState>(undefined);
  const [pending, startTransition] = useTransition();

  const linkedOwnerIds = new Set(links.map((link) => link.ownerId));
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return owners.filter(
      (owner) => !linkedOwnerIds.has(owner.id) && (!needle || owner.fullNameOrCompany.toLowerCase().includes(needle))
    );
    // linkedOwnerIds is derived from `links` each render — recompute the filter whenever links or the query changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owners, search, links]);

  function link(ownerId: string) {
    const formData = new FormData();
    formData.set("ownerId", ownerId);
    formData.set("role", role);
    if (quoteShare) formData.set("quoteShare", quoteShare);
    if (isMainContact) formData.set("isMainContact", "on");

    startTransition(async () => {
      const result = await addPropertyOwnerLink(propertyId, undefined, formData);
      setAddState(result);
      if (!result?.error) {
        const owner = owners.find((candidate) => candidate.id === ownerId);
        if (owner) {
          setLinks((prev) => [
            ...prev,
            { id: `${ownerId}-pending`, ownerId, role, quoteShare: quoteShare ? Number(quoteShare) : null, isMainContact, owner },
          ]);
        }
        setSelectedOwnerId("");
        setQuoteShare("");
        setIsMainContact(false);
        setSearch("");
      }
    });
  }

  function handleQuickCreate() {
    if (!quickName.trim()) return;
    const createFormData = new FormData();
    createFormData.set("kind", quickKind);
    createFormData.set("fullNameOrCompany", quickName);

    startTransition(async () => {
      const created = await createOwnerQuick(undefined, createFormData);
      if (!created?.owner) {
        setAddState(created);
        return;
      }
      setOwners((prev) => [...prev, { id: created.owner!.id, fullNameOrCompany: created.owner!.fullNameOrCompany, kind: quickKind, city: null }]);
      link(created.owner.id);
      setQuickName("");
    });
  }

  function remove(linkId: string) {
    if (!window.confirm("Retirer ce propriétaire de ce bien ?")) return;
    setLinks((prev) => prev.filter((link) => link.id !== linkId));
    startTransition(() => removePropertyOwnerLink(linkId));
  }

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Propriétaires</h4>

      {links.length === 0 && legacyOwnerInfo && (legacyOwnerInfo.ownerName || legacyOwnerInfo.ownerPhone || legacyOwnerInfo.ownerEmail) && (
        <div className="rounded-xl border border-dashed border-anthracite-200 bg-anthracite-50 p-3 text-xs text-anthracite-500">
          <p className="font-semibold uppercase tracking-wider text-anthracite-400">Informations historiques non structurées</p>
          <p className="mt-1">
            {[legacyOwnerInfo.ownerName, legacyOwnerInfo.ownerPhone, legacyOwnerInfo.ownerEmail].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-1">Saisies dans les données privées avant ce module — rattachez un propriétaire structuré ci-dessous.</p>
        </div>
      )}

      {links.length === 0 ? (
        <p className="text-sm text-anthracite-400">Aucun propriétaire rattaché.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((link) => (
            <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 bg-white p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-anthracite-900">{link.owner.fullNameOrCompany}</span>
                <span className="text-xs text-anthracite-400">
                  {propertyOwnerRoleOptions.find((option) => option.value === link.role)?.label ?? link.role}
                  {link.quoteShare != null ? ` · ${link.quoteShare}%` : ""}
                  {link.isMainContact ? " · Contact principal" : ""}
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
        <summary className="cursor-pointer text-sm font-medium text-anthracite-700">+ Rattacher un propriétaire</summary>
        <div className="mt-3 flex flex-col gap-3">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un propriétaire…"
            className={inputClass}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <select value={role} onChange={(event) => setRole(event.target.value)} className={inputClass}>
              {propertyOwnerRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={quoteShare}
              onChange={(event) => setQuoteShare(event.target.value)}
              placeholder="Quote-part (%)"
              className={inputClass}
            />
            <label className="flex items-center gap-2 text-sm text-anthracite-700">
              <input type="checkbox" checked={isMainContact} onChange={(event) => setIsMainContact(event.target.checked)} className="h-4 w-4 rounded border-anthracite-300" />
              Contact principal
            </label>
          </div>

          {filtered.length > 0 ? (
            <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
              {filtered.map((owner) => (
                <li key={owner.id}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => link(owner.id)}
                    className={[
                      "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      selectedOwnerId === owner.id ? "border-gold-500 bg-gold-200/30" : "border-anthracite-200 hover:border-gold-300",
                    ].join(" ")}
                  >
                    <span>{owner.fullNameOrCompany}</span>
                    <span className="text-xs text-anthracite-400">{owner.city ?? ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl border border-anthracite-100 bg-anthracite-50 p-3">
              <p className="text-xs text-anthracite-500">Aucun propriétaire ne correspond — créer rapidement :</p>
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
