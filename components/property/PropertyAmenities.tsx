import {
  equipmentCategories,
  getTagDefinition,
  type Property,
  type PropertyEquipment,
} from "@/lib/properties";

type AmenityGroup = { title: string; items: string[] };

function activeLabels(active: Partial<Record<string, boolean>>, categoryId: keyof PropertyEquipment): string[] {
  const category = equipmentCategories.find((entry) => entry.id === categoryId);
  if (!category) return [];
  return category.options.filter((option) => active[option.key]).map((option) => option.label);
}

function viewLabels(property: Property): string[] {
  return property.tags
    .map((slug) => getTagDefinition(slug))
    .filter((tag): tag is NonNullable<typeof tag> => tag?.category === "vue")
    .map((tag) => tag.label.fr);
}

export default function PropertyAmenities({ property }: { property: Property }) {
  const groups: AmenityGroup[] = [
    { title: "Extérieur", items: activeLabels(property.equipment.exterior, "exterior") },
    { title: "Confort", items: activeLabels(property.equipment.comfort, "comfort") },
    { title: "Sécurité", items: activeLabels(property.equipment.security, "security") },
    { title: "Loisirs", items: activeLabels(property.equipment.leisure, "leisure") },
    { title: "Technique", items: activeLabels(property.equipment.technical, "technical") },
    { title: "Vue", items: viewLabels(property) },
    {
      title: "Juridique & investissement",
      items: [
        ...activeLabels(property.equipment.legal, "legal"),
        ...activeLabels(property.equipment.marketing, "marketing"),
      ],
    },
  ].filter((group) => group.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-2xl font-semibold text-anthracite-950">Équipements et atouts</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {groups.map((group) => (
          <div key={group.title} className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-600">{group.title}</h3>
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-anthracite-200 px-3 py-1.5 text-xs text-anthracite-700"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
