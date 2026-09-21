"use client";

import { useMemo, useState, useTransition } from "react";
import Button from "@/components/Button";
import { createPropertyTag, type TagFormState } from "@/lib/admin/property-actions";
import { tagCategoryLabels, tagCategoryOptions } from "@/lib/admin/property-enum-maps";
import type { TagCategory } from "@/lib/property-schema";

export type TagPickerOption = { slug: string; labelFr: string; category: TagCategory };

const inputClass =
  "rounded-xl border border-anthracite-200 px-3 py-2 text-sm text-anthracite-900 outline-none transition-colors focus:border-gold-500";

type TagPickerProps = {
  allTags: TagPickerOption[];
  selected: string[];
  onChange: (slugs: string[]) => void;
  canCreateTag: boolean;
};

export default function TagPicker({ allTags, selected, onChange, canCreateTag }: TagPickerProps) {
  const [tags, setTags] = useState(allTags);
  const [search, setSearch] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState<TagCategory | "">("");
  const [tagState, setTagState] = useState<TagFormState>(undefined);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return tags.filter((tag) => !needle || tag.labelFr.toLowerCase().includes(needle));
  }, [tags, search]);

  const byCategory = useMemo(() => {
    const groups = new Map<TagCategory, TagPickerOption[]>();
    for (const tag of filtered) {
      const list = groups.get(tag.category) ?? [];
      list.push(tag);
      groups.set(tag.category, list);
    }
    return groups;
  }, [filtered]);

  function toggle(slug: string) {
    onChange(selected.includes(slug) ? selected.filter((value) => value !== slug) : [...selected, slug]);
  }

  // Calling the Server Action directly (no <form>): a mini "create tag" form
  // nested inside the surrounding dossier <form> would be invalid HTML.
  function handleCreateTag() {
    if (!newLabel.trim() || !newCategory) return;
    const formData = new FormData();
    formData.set("labelFr", newLabel);
    formData.set("category", newCategory);
    startTransition(async () => {
      const result = await createPropertyTag(undefined, formData);
      setTagState(result);
      if (result?.tag) {
        const createdTag = result.tag;
        setTags((prev) => (prev.some((tag) => tag.slug === createdTag.slug) ? prev : [...prev, createdTag]));
        onChange([...selected, createdTag.slug]);
        setNewLabel("");
        setNewCategory("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher un tag…"
        className={inputClass}
        aria-label="Rechercher un tag"
      />

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((slug) => {
            const tag = tags.find((candidate) => candidate.slug === slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggle(slug)}
                className="inline-flex items-center gap-1.5 rounded-full bg-gold-200/60 px-3 py-1 text-xs font-medium text-anthracite-900 hover:bg-gold-200"
              >
                {tag?.labelFr ?? slug}
                <span aria-hidden="true">×</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex max-h-72 flex-col gap-4 overflow-y-auto rounded-2xl border border-anthracite-100 p-4">
        {[...byCategory.entries()].map(([category, categoryTags]) => (
          <div key={category} className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-400">
              {tagCategoryLabels[category]}
            </span>
            <div className="flex flex-wrap gap-2">
              {categoryTags.map((tag) => {
                const isSelected = selected.includes(tag.slug);
                return (
                  <label
                    key={tag.slug}
                    className={[
                      "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
                      isSelected
                        ? "border-gold-500 bg-gold-200/40 text-anthracite-950"
                        : "border-anthracite-200 text-anthracite-600 hover:border-gold-300",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-anthracite-300"
                      checked={isSelected}
                      onChange={() => toggle(tag.slug)}
                    />
                    {tag.labelFr}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-anthracite-400">Aucun tag ne correspond.</p>}
      </div>

      {/* Hidden inputs so the surrounding dossier <form> submits the selection. */}
      {selected.map((slug) => (
        <input key={slug} type="hidden" name="tags" value={slug} />
      ))}

      {canCreateTag && (
        <details className="rounded-2xl border border-dashed border-anthracite-200 p-4">
          <summary className="cursor-pointer text-sm font-medium text-anthracite-700">
            + Créer un nouveau tag
          </summary>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-anthracite-500" htmlFor="new-tag-label">
                Libellé
              </label>
              <input
                id="new-tag-label"
                value={newLabel}
                onChange={(event) => setNewLabel(event.target.value)}
                className={inputClass}
              />
              {tagState?.fieldErrors?.labelFr && (
                <span className="text-xs text-red-600">{tagState.fieldErrors.labelFr}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-anthracite-500" htmlFor="new-tag-category">
                Catégorie
              </label>
              <select
                id="new-tag-category"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value as TagCategory)}
                className={inputClass}
              >
                <option value="" disabled>
                  Sélectionner…
                </option>
                {tagCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {tagState?.fieldErrors?.category && (
                <span className="text-xs text-red-600">{tagState.fieldErrors.category}</span>
              )}
            </div>
            <Button type="button" size="sm" disabled={pending} onClick={handleCreateTag}>
              {pending ? "Création…" : "Créer"}
            </Button>
          </div>
          {tagState?.error && <p className="mt-2 text-xs text-red-600">{tagState.error}</p>}
        </details>
      )}
    </div>
  );
}
