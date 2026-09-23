import Link from "next/link";

export type SettingsTabId = "agence" | "equipe" | "referentiels";

export const settingsTabs: { id: SettingsTabId; label: string }[] = [
  { id: "agence", label: "Informations de l'agence" },
  { id: "equipe", label: "Équipe & accès" },
  { id: "referentiels", label: "Référentiels" },
];

export default function SettingsTabs({ active }: { active: SettingsTabId }) {
  return (
    <nav aria-label="Sections des paramètres" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1 rounded-full border border-anthracite-100 bg-white p-1 sm:w-fit">
        {settingsTabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <li key={tab.id}>
              <Link
                href={tab.id === "agence" ? "/admin/parametres" : `/admin/parametres?onglet=${tab.id}`}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "block whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                  isActive ? "bg-anthracite-900 text-gold-400" : "text-anthracite-500 hover:bg-anthracite-50 hover:text-anthracite-900",
                ].join(" ")}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
