"use client";

import { useMemo, useState, useTransition } from "react";
import {
  updatePropertyDevelopmentLink,
  type RelationFormState,
} from "@/lib/real-estate-network/property-links-actions";
import { createProgram, type ProgramFormState } from "@/lib/real-estate-network/program-actions";
import { createPromoter } from "@/lib/real-estate-network/promoter-actions";
import { lotStatusOptions } from "@/lib/real-estate-network/enum-labels";
import { inputClass } from "./FormField";

export type ProgramPickerOption = {
  id: string;
  name: string;
  promoter: { id: string; companyName: string };
  lots: { id: string; reference: string; status: string }[];
};

export type PromoterPickerOption = { id: string; companyName: string };

type Props = {
  propertyId: string;
  currentProgramId: string | null;
  currentLotId: string | null;
  initialPrograms: ProgramPickerOption[];
  initialPromoters: PromoterPickerOption[];
};

export default function DevelopmentLinkManager({ propertyId, currentProgramId, currentLotId, initialPrograms, initialPromoters }: Props) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [promoters, setPromoters] = useState(initialPromoters);
  const [search, setSearch] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState(currentProgramId ?? "");
  const [selectedLotId, setSelectedLotId] = useState(currentLotId ?? "");
  const [state, setState] = useState<RelationFormState | ProgramFormState>(undefined);
  const [pending, startTransition] = useTransition();

  const [quickProgramName, setQuickProgramName] = useState("");
  const [quickProgramCity, setQuickProgramCity] = useState("");
  const [quickPromoterId, setQuickPromoterId] = useState("");
  const [quickPromoterName, setQuickPromoterName] = useState("");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return programs.filter((program) => !needle || program.name.toLowerCase().includes(needle));
  }, [programs, search]);

  const selectedProgram = programs.find((program) => program.id === selectedProgramId);

  function save(programId: string, lotId: string) {
    const formData = new FormData();
    if (programId) formData.set("developmentProgramId", programId);
    if (lotId) formData.set("developmentLotId", lotId);
    startTransition(async () => {
      const result = await updatePropertyDevelopmentLink(propertyId, undefined, formData);
      setState(result);
    });
  }

  function selectProgram(programId: string) {
    setSelectedProgramId(programId);
    setSelectedLotId("");
    save(programId, "");
  }

  function selectLot(lotId: string) {
    setSelectedLotId(lotId);
    save(selectedProgramId, lotId);
  }

  function clear() {
    setSelectedProgramId("");
    setSelectedLotId("");
    save("", "");
  }

  function handleQuickCreatePromoter() {
    if (!quickPromoterName.trim()) return;
    const formData = new FormData();
    formData.set("companyName", quickPromoterName);
    startTransition(async () => {
      const created = await createPromoter(undefined, formData);
      if (!created?.promoter) {
        setState(created);
        return;
      }
      setPromoters((prev) => [...prev, created.promoter!]);
      setQuickPromoterId(created.promoter.id);
      setQuickPromoterName("");
    });
  }

  function handleQuickCreateProgram() {
    if (!quickProgramName.trim() || !quickProgramCity.trim() || !quickPromoterId) return;
    const formData = new FormData();
    formData.set("name", quickProgramName);
    formData.set("city", quickProgramCity);
    formData.set("promoterId", quickPromoterId);
    formData.set("status", "ETUDE");
    startTransition(async () => {
      const created = await createProgram(undefined, formData);
      if (!created?.program) {
        setState(created);
        return;
      }
      const promoter = promoters.find((candidate) => candidate.id === quickPromoterId);
      const newProgram: ProgramPickerOption = {
        id: created.program.id,
        name: created.program.name,
        promoter: promoter ?? { id: quickPromoterId, companyName: "" },
        lots: [],
      };
      setPrograms((prev) => [...prev, newProgram]);
      selectProgram(newProgram.id);
      setQuickProgramName("");
      setQuickProgramCity("");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Programme neuf / lot</h4>

      {selectedProgram ? (
        <div className="flex flex-col gap-3 rounded-xl border border-anthracite-100 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-anthracite-900">{selectedProgram.name}</span>
              <span className="text-xs text-anthracite-400">{selectedProgram.promoter.companyName}</span>
            </div>
            <button type="button" onClick={clear} className="text-xs font-semibold text-red-600 hover:underline">
              Détacher
            </button>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Lot (optionnel)</span>
            <select value={selectedLotId} onChange={(event) => selectLot(event.target.value)} className={inputClass} disabled={pending}>
              <option value="">Aucun lot spécifique</option>
              {selectedProgram.lots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.reference} — {lotStatusOptions.find((option) => option.value === lot.status)?.label ?? lot.status}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <p className="text-sm text-anthracite-400">Aucun programme rattaché.</p>
      )}

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <details className="rounded-2xl border border-dashed border-anthracite-200 p-4">
        <summary className="cursor-pointer text-sm font-medium text-anthracite-700">
          {selectedProgram ? "Changer de programme" : "+ Rattacher un programme"}
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un programme…"
            className={inputClass}
          />

          {filtered.length > 0 && (
            <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
              {filtered.map((program) => (
                <li key={program.id}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => selectProgram(program.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-anthracite-200 px-3 py-2 text-left text-sm transition-colors hover:border-gold-300"
                  >
                    <span>{program.name}</span>
                    <span className="text-xs text-anthracite-400">{program.promoter.companyName}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-2 rounded-xl border border-anthracite-100 bg-anthracite-50 p-3">
            <p className="text-xs text-anthracite-500">Aucun programme ne correspond — créer rapidement :</p>
            <div className="flex flex-wrap items-end gap-2">
              <input
                type="text"
                value={quickProgramName}
                onChange={(event) => setQuickProgramName(event.target.value)}
                placeholder="Nom du programme"
                className={inputClass}
              />
              <input
                type="text"
                value={quickProgramCity}
                onChange={(event) => setQuickProgramCity(event.target.value)}
                placeholder="Ville"
                className={inputClass}
              />
              <select value={quickPromoterId} onChange={(event) => setQuickPromoterId(event.target.value)} className={inputClass}>
                <option value="">Promoteur…</option>
                {promoters.map((promoter) => (
                  <option key={promoter.id} value={promoter.id}>
                    {promoter.companyName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={pending}
                onClick={handleQuickCreateProgram}
                className="rounded-full bg-anthracite-950 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-anthracite-800 disabled:cursor-not-allowed disabled:bg-anthracite-300"
              >
                Créer et rattacher
              </button>
            </div>

            <p className="text-xs text-anthracite-400">Aucun promoteur ne correspond ? Créer rapidement :</p>
            <div className="flex flex-wrap items-end gap-2">
              <input
                type="text"
                value={quickPromoterName}
                onChange={(event) => setQuickPromoterName(event.target.value)}
                placeholder="Raison sociale du promoteur"
                className={inputClass}
              />
              <button
                type="button"
                disabled={pending}
                onClick={handleQuickCreatePromoter}
                className="rounded-full border border-anthracite-300 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-anthracite-700 hover:border-gold-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Créer le promoteur
              </button>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
