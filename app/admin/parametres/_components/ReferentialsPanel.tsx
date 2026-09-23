import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { moroccoCityTaxonomy } from "@/lib/admin/geo-taxonomy";
import {
  propertyTypeLabels,
  propertySubTypesByType,
  propertyTypeValues,
  equipmentCategories,
  tagTaxonomy,
  transactionLabels,
  transactionValues,
} from "@/lib/property-schema";
import {
  propertyStatusLabels,
  propertyStatusValues,
  publicationStatusLabels,
  tagCategoryLabels,
  visibilityLabels,
} from "@/lib/admin/property-enum-maps";

function ReferentialCard({
  title,
  summary,
  sources,
  children,
}: {
  title: string;
  summary: string;
  sources: string[];
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-anthracite-100 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-display text-lg font-semibold text-anthracite-950">{title}</h3>
          <p className="text-sm text-anthracite-500">{summary}</p>
        </div>
        <span className="shrink-0 rounded-full border border-gold-300 bg-gold-200/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-700">
          Gestion centralisée — évolution ultérieure
        </span>
      </div>
      {children}
      <div className="flex flex-wrap items-center gap-2 border-t border-anthracite-100 pt-3 text-xs text-anthracite-500">
        <span className="font-semibold uppercase tracking-wider">Source</span>
        {sources.map((source) => (
          <code key={source} className="break-all rounded-md bg-anthracite-50 px-2 py-0.5 text-[11px] text-anthracite-700">
            {source}
          </code>
        ))}
      </div>
    </section>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className="rounded-full bg-anthracite-50 px-2.5 py-1 text-xs text-anthracite-700">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl border border-anthracite-100 px-4 py-3">
      <summary className="cursor-pointer list-none text-sm font-medium text-anthracite-800 marker:hidden">
        <span className="mr-2 inline-block text-gold-600 transition-transform group-open:rotate-90">›</span>
        {label}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

/** Read-only overview of the vocabularies controlled by code — no fake editing UI. */
export default async function ReferentialsPanel() {
  const [activeTagCount, inactiveTagCount] = await Promise.all([
    prisma.propertyTag.count({ where: { isActive: true } }),
    prisma.propertyTag.count({ where: { isActive: false } }),
  ]);

  const districtCount = moroccoCityTaxonomy.reduce((sum, city) => sum + city.districts.length, 0);
  const subTypeCount = propertyTypeValues.reduce((sum, type) => sum + propertySubTypesByType[type].length, 0);
  const tagsByCategory = Object.entries(tagCategoryLabels).map(([category, label]) => ({
    label,
    count: tagTaxonomy.filter((tag) => tag.category === category).length,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold text-anthracite-950">Référentiels</h2>
        <p className="text-sm text-anthracite-500">
          Ces listes sont définies dans le code et partagées entre le back-office et le site public. Elles ne sont pas encore
          modifiables depuis cette interface : toute évolution passe par une mise à jour de l&apos;application.
        </p>
      </div>

      <ReferentialCard
        title="Villes et quartiers"
        summary={`${moroccoCityTaxonomy.length} villes et ${districtCount} quartiers suggérés dans les fiches biens. La saisie libre reste possible ; la liste alimente l'autocomplétion et le centrage de la carte.`}
        sources={["lib/admin/geo-taxonomy.ts"]}
      >
        <Disclosure label="Voir les villes et leurs quartiers">
          <ul className="grid gap-3 sm:grid-cols-2">
            {moroccoCityTaxonomy.map((city) => (
              <li key={city.city} className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold text-anthracite-900">{city.city}</span>
                <span className="text-xs text-anthracite-500">
                  {city.districts.length > 0 ? city.districts.map((district) => district.name).join(", ") : "Aucun quartier suggéré"}
                </span>
              </li>
            ))}
          </ul>
        </Disclosure>
      </ReferentialCard>

      <ReferentialCard
        title="Types et sous-types de biens"
        summary={`${propertyTypeValues.length} types, ${subTypeCount} sous-types et ${transactionValues.length} types de transaction, alignés sur les énumérations de la base de données.`}
        sources={["lib/property-schema.ts", "lib/admin/property-enum-maps.ts", "prisma/schema.prisma (PropertyType, PropertyTransaction)"]}
      >
        <Chips items={transactionValues.map((value) => transactionLabels[value])} />
        <Disclosure label="Voir les types et sous-types">
          <ul className="grid gap-3 sm:grid-cols-2">
            {propertyTypeValues.map((type) => (
              <li key={type} className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold text-anthracite-900">{propertyTypeLabels[type]}</span>
                <span className="text-xs text-anthracite-500">
                  {propertySubTypesByType[type].map((subType) => subType.label).join(", ") || "Aucun sous-type"}
                </span>
              </li>
            ))}
          </ul>
        </Disclosure>
      </ReferentialCard>

      <ReferentialCard
        title="Tags et équipements"
        summary={`${tagTaxonomy.length} tags de référence, chargés dans la base par le seed (${activeTagCount} actifs${inactiveTagCount > 0 ? `, ${inactiveTagCount} inactifs` : ""}), et ${equipmentCategories.length} catégories d'équipements.`}
        sources={["lib/property-schema.ts (tagTaxonomy, equipmentCategories)", "prisma/seed.ts", "table PropertyTag"]}
      >
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {tagsByCategory.map((category) => (
            <li key={category.label} className="flex items-center justify-between gap-2 rounded-xl bg-anthracite-50 px-3 py-2 text-sm">
              <span className="text-anthracite-700">{category.label}</span>
              <span className="font-semibold text-anthracite-950">{category.count}</span>
            </li>
          ))}
        </ul>
        <Disclosure label="Voir les équipements par catégorie">
          <ul className="flex flex-col gap-3">
            {equipmentCategories.map((category) => (
              <li key={category.id} className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-anthracite-900">{category.label}</span>
                <Chips items={category.options.map((option) => option.label)} />
              </li>
            ))}
          </ul>
        </Disclosure>
      </ReferentialCard>

      <ReferentialCard
        title="Statuts de publication et visibilité"
        summary="Cycle de vie d'un bien dans le back-office. Seuls les super administrateurs et administrateurs peuvent publier ou archiver ; seuls les biens publiés apparaissent sur le site — visibilité publique dans le catalogue, off-market dans la sélection dédiée, jamais les biens privés."
        sources={["lib/admin/property-enum-maps.ts", "lib/property-permissions.ts", "prisma/schema.prisma (PublicationStatus, Visibility, PropertyStatus)"]}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Publication</span>
            <Chips items={Object.values(publicationStatusLabels)} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Visibilité</span>
            <Chips items={Object.values(visibilityLabels)} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Statut commercial</span>
            <Chips items={propertyStatusValues.map((value) => propertyStatusLabels[value])} />
          </div>
        </div>
      </ReferentialCard>
    </div>
  );
}
