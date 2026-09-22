import {
  conditionLabels,
  availabilityLabels,
  furnishedLabels,
  orientationLabels,
  type Property,
  type PropertyDetails,
} from "@/lib/properties";

type Fact = { label: string; value: string };
type FactGroup = { title: string; items: Fact[] };

const surfaceFieldLabels: { key: keyof Property["layout"]; label: string }[] = [
  { key: "livingArea", label: "Surface habitable" },
  { key: "builtArea", label: "Surface bâtie" },
  { key: "landArea", label: "Surface terrain" },
  { key: "titledArea", label: "Surface titrée" },
  { key: "terraceArea", label: "Terrasse" },
  { key: "balconyArea", label: "Balcon" },
  { key: "gardenArea", label: "Jardin" },
  { key: "rooftopArea", label: "Rooftop" },
  { key: "basementArea", label: "Sous-sol" },
  { key: "parkingArea", label: "Surface parking" },
];

const roomFieldLabels: { key: keyof Property["layout"]; label: string }[] = [
  { key: "bedrooms", label: "Chambres" },
  { key: "suites", label: "Suites" },
  { key: "bathrooms", label: "Salles de bain" },
  { key: "guestToilets", label: "WC invités" },
  { key: "livingRooms", label: "Salons" },
  { key: "kitchens", label: "Cuisines" },
];

const floorPositionLabels: Record<string, string> = {
  rdc: "Rez-de-chaussée",
  intermediaire: "Étage intermédiaire",
  "dernier-etage": "Dernier étage",
};

const landUseLabels: Record<string, string> = {
  villa: "Villa",
  immeuble: "Immeuble",
  agricole: "Agricole",
  industriel: "Industriel",
  mixte: "Mixte",
};

const titleTypeLabels: Record<string, string> = {
  "titre-foncier": "Titre foncier",
  melkia: "Melkia",
  "requisition-immatriculation": "Réquisition d'immatriculation",
};

const footTrafficLabels: Record<string, string> = {
  faible: "Faible affluence",
  moyen: "Affluence moyenne",
  eleve: "Forte affluence",
};

function buildSurfaceFacts(layout: Property["layout"]): Fact[] {
  return surfaceFieldLabels
    .filter(({ key }) => layout[key] !== undefined)
    .map(({ key, label }) => ({ label, value: `${layout[key]} m²` }));
}

function buildRoomFacts(layout: Property["layout"]): Fact[] {
  return roomFieldLabels
    .filter(({ key }) => layout[key] !== undefined)
    .map(({ key, label }) => ({ label, value: `${layout[key]}` }));
}

function buildBuildingFacts(layout: Property["layout"]): Fact[] {
  const facts: Fact[] = [];

  if (layout.floor !== undefined || layout.totalFloors !== undefined) {
    const value =
      layout.floor !== undefined && layout.totalFloors !== undefined
        ? `Étage ${layout.floor} sur ${layout.totalFloors}`
        : layout.floor !== undefined
          ? `Étage ${layout.floor}`
          : `${layout.totalFloors} niveau(x)`;
    facts.push({ label: "Étage", value });
  }
  if (layout.elevator) facts.push({ label: "Ascenseur", value: "Oui" });
  if (layout.garages !== undefined) facts.push({ label: "Garages", value: `${layout.garages}` });
  if (layout.parkingSpaces !== undefined) {
    facts.push({ label: "Places de parking", value: `${layout.parkingSpaces}` });
  }
  if (layout.cellar) facts.push({ label: "Cave", value: "Oui" });
  if (layout.storageRoom) facts.push({ label: "Chambre de rangement", value: "Oui" });
  if (layout.yearBuilt !== undefined) facts.push({ label: "Année de construction", value: `${layout.yearBuilt}` });
  if (layout.renovationYear !== undefined) {
    facts.push({ label: "Année de rénovation", value: `${layout.renovationYear}` });
  }
  if (layout.condition) facts.push({ label: "État", value: conditionLabels[layout.condition] });
  if (layout.availability) facts.push({ label: "Disponibilité", value: availabilityLabels[layout.availability] });
  if (layout.furnished) facts.push({ label: "Ameublement", value: furnishedLabels[layout.furnished] });

  return facts;
}

function buildDetailFacts(details: PropertyDetails | undefined): Fact[] {
  if (!details) return [];
  const facts: Fact[] = [];

  switch (details.kind) {
    case "villa-maison-riad":
      if (details.patios !== undefined) facts.push({ label: "Patios", value: `${details.patios}` });
      if (details.staffQuarters) facts.push({ label: "Logement du personnel", value: "Oui" });
      if (details.independentEntrance) facts.push({ label: "Entrée indépendante", value: "Oui" });
      if (details.poolOrientation) {
        facts.push({ label: "Orientation piscine", value: orientationLabels[details.poolOrientation] });
      }
      break;
    case "appartement-duplex-penthouse":
      if (details.residenceName) facts.push({ label: "Résidence", value: details.residenceName });
      if (details.totalUnitsInResidence !== undefined) {
        facts.push({ label: "Lots dans la résidence", value: `${details.totalUnitsInResidence}` });
      }
      if (details.floorPosition) {
        facts.push({ label: "Position", value: floorPositionLabels[details.floorPosition] });
      }
      if (details.concierge) facts.push({ label: "Conciergerie", value: "Oui" });
      break;
    case "terrain":
      if (details.landUse) facts.push({ label: "Zonage", value: landUseLabels[details.landUse] });
      if (details.buildingRightsCos !== undefined) {
        facts.push({ label: "COS", value: `${details.buildingRightsCos}` });
      }
      if (details.buildingRightsCus !== undefined) {
        facts.push({ label: "CUS", value: `${details.buildingRightsCus}` });
      }
      if (details.serviced) facts.push({ label: "Terrain viabilisé", value: "Oui" });
      if (details.fenced) facts.push({ label: "Terrain clôturé", value: "Oui" });
      if (details.titleType) facts.push({ label: "Type de titre", value: titleTypeLabels[details.titleType] });
      break;
    case "hotel-maison-hotes":
      if (details.roomsCount !== undefined) {
        facts.push({ label: "Chambres d'exploitation", value: `${details.roomsCount}` });
      }
      if (details.starRating !== undefined) {
        facts.push({ label: "Classification", value: `${details.starRating} étoiles` });
      }
      if (details.occupancyRatePercent !== undefined) {
        facts.push({ label: "Taux d'occupation", value: `${details.occupancyRatePercent}%` });
      }
      if (details.licenseType) facts.push({ label: "Licence", value: details.licenseType });
      if (details.restaurantOnSite) facts.push({ label: "Restaurant sur place", value: "Oui" });
      break;
    case "commerce-bureau-depot":
      if (details.activityType) facts.push({ label: "Activité", value: details.activityType });
      if (details.footTraffic) facts.push({ label: "Affluence", value: footTrafficLabels[details.footTraffic] });
      if (details.storefrontWidthMeters !== undefined) {
        facts.push({ label: "Façade", value: `${details.storefrontWidthMeters} m` });
      }
      if (details.ceilingHeightMeters !== undefined) {
        facts.push({ label: "Hauteur sous plafond", value: `${details.ceilingHeightMeters} m` });
      }
      if (details.goodwillIncluded) facts.push({ label: "Fonds de commerce inclus", value: "Oui" });
      break;
    case "programme-neuf":
      if (details.programName) facts.push({ label: "Programme", value: details.programName });
      if (details.developerName) facts.push({ label: "Promoteur", value: details.developerName });
      if (details.deliveryDate) {
        facts.push({
          label: "Livraison",
          value: new Date(details.deliveryDate).toLocaleDateString("fr-FR", { year: "numeric", month: "long" }),
        });
      }
      if (details.lotsTotal !== undefined) facts.push({ label: "Lots au total", value: `${details.lotsTotal}` });
      if (details.lotsAvailable !== undefined) {
        facts.push({ label: "Lots disponibles", value: `${details.lotsAvailable}` });
      }
      if (details.constructionProgressPercent !== undefined) {
        facts.push({ label: "Avancement des travaux", value: `${details.constructionProgressPercent}%` });
      }
      break;
  }

  return facts;
}

type PropertyFactsProps = {
  property: Property;
};

export default function PropertyFacts({ property }: PropertyFactsProps) {
  const groups: FactGroup[] = [
    { title: "Surfaces", items: buildSurfaceFacts(property.layout) },
    { title: "Pièces", items: buildRoomFacts(property.layout) },
    { title: "Bâtiment & état", items: buildBuildingFacts(property.layout) },
    { title: "Spécificités", items: buildDetailFacts(property.details) },
  ].filter((group) => group.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-2xl font-semibold text-anthracite-950">Caractéristiques</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {groups.map((group) => (
          <div key={group.title} className="flex flex-col gap-3 rounded-2xl border border-anthracite-100 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-600">{group.title}</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {group.items.map((item) => (
                <div key={item.label} className="contents">
                  <dt className="text-anthracite-500">{item.label}</dt>
                  <dd className="text-right font-medium text-anthracite-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
