"use client";

import { useMemo, useState } from "react";
import { inputClass } from "@/app/admin/biens/_components/FormField";

export type SearchPickerOption = { id: string; label: string; sublabel?: string };

/**
 * Text-filtered single picker: a search input plus a scrollable list of
 * matching buttons, with a hidden input carrying the selected id — same
 * pattern as the promoter picker in app/admin/programmes/_components/ProgramForm.tsx,
 * pulled out here because the CRM forms need it for prospects/biens/agents.
 */
export default function SearchPicker({
  name,
  options,
  value,
  onChange,
  placeholder = "Rechercher…",
  emptyLabel = "Aucun résultat.",
}: {
  name: string;
  options: SearchPickerOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  emptyLabel?: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (option) => option.label.toLowerCase().includes(needle) || option.sublabel?.toLowerCase().includes(needle)
    );
  }, [options, search]);

  const selected = options.find((option) => option.id === value);

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      <div className="mt-2 flex max-h-44 flex-col gap-1 overflow-y-auto">
        {filtered.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={[
              "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              value === option.id ? "border-gold-500 bg-gold-200/30" : "border-anthracite-200 hover:border-gold-300",
            ].join(" ")}
          >
            {option.label}
            {option.sublabel && <span className="block text-xs text-anthracite-400">{option.sublabel}</span>}
          </button>
        ))}
        {filtered.length === 0 && <p className="px-1 py-2 text-xs text-anthracite-400">{emptyLabel}</p>}
      </div>
      {selected && <p className="mt-1 text-xs text-anthracite-500">Sélectionné : {selected.label}</p>}
    </div>
  );
}
