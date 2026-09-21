import type { Metadata } from "next";
import Badge from "@/components/Badge";
import { commercialStatusLabels, formatPropertyPrice, properties, type CommercialStatus } from "@/lib/properties";

export const metadata: Metadata = {
  title: "Admin | NA Business Africa",
  description: "Écran d'administration provisoire de NA Business Africa.",
};

const stats = [
  { label: "Biens actifs", value: properties.length },
  { label: "Off-market", value: properties.filter((p) => p.commercialStatus === "off-market").length },
  { label: "Disponibles", value: properties.filter((p) => p.commercialStatus === "disponible").length },
  { label: "Villes couvertes", value: new Set(properties.map((p) => p.location.city)).size },
];

const statusTone: Record<CommercialStatus, "gold" | "anthracite" | "outline"> = {
  disponible: "anthracite",
  reserve: "outline",
  "sous-compromis": "outline",
  vendu: "outline",
  loue: "outline",
  retire: "outline",
  "off-market": "gold",
};

export default function AdminPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-16 lg:px-8">
      <div className="flex flex-col gap-2 rounded-2xl border border-gold-300 bg-gold-200/30 p-5">
        <p className="text-sm font-semibold text-anthracite-900">
          Écran provisoire — aucune authentification réelle n&apos;est en place.
        </p>
        <p className="text-sm text-anthracite-600">
          Cet espace admin est un aperçu du back-office prévu en phase 2 (authentification,
          gestion des biens, demandes de contact).
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
          Back-office
        </span>
        <h1 className="font-display text-3xl font-semibold text-anthracite-950">
          Tableau de bord
        </h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 p-6">
            <span className="font-display text-3xl font-semibold text-anthracite-950">
              {stat.value}
            </span>
            <span className="text-sm text-anthracite-500">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-anthracite-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-anthracite-950 text-white">
            <tr>
              <th className="px-4 py-3 font-medium">Bien</th>
              <th className="px-4 py-3 font-medium">Ville</th>
              <th className="px-4 py-3 font-medium">Prix</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property, index) => (
              <tr
                key={property.id}
                className={index % 2 === 0 ? "bg-white" : "bg-anthracite-50"}
              >
                <td className="px-4 py-3 font-medium text-anthracite-900">{property.title.fr}</td>
                <td className="px-4 py-3 text-anthracite-600">{property.location.city}</td>
                <td className="px-4 py-3 text-anthracite-600">{formatPropertyPrice(property)}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[property.commercialStatus] ?? "outline"}>
                    {commercialStatusLabels[property.commercialStatus]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="cursor-not-allowed text-xs font-semibold uppercase tracking-wider text-anthracite-300">
                    Modifier
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
