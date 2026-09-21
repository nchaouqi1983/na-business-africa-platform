export type PropertyType =
  | "Villa"
  | "Riad"
  | "Penthouse"
  | "Duplex"
  | "Maison";

export type PropertyStatus = "Disponible" | "Réservé" | "Off-market";

export type PropertyBadge =
  | "Nouveau"
  | "Exclusif"
  | "Coup de cœur"
  | "Off-market";

export type Property = {
  id: string;
  slug: string;
  title: string;
  city: string;
  type: PropertyType;
  status: PropertyStatus;
  badge?: PropertyBadge;
  price: number;
  currency: "MAD";
  surface: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  features: string[];
  gradient: string;
};

export const properties: Property[] = [
  {
    id: "1",
    slug: "villa-vue-mer-tanger",
    title: "Villa contemporaine avec vue sur mer",
    city: "Tanger",
    type: "Villa",
    status: "Disponible",
    badge: "Nouveau",
    price: 8500000,
    currency: "MAD",
    surface: 420,
    bedrooms: 5,
    bathrooms: 4,
    description:
      "Architecture contemporaine ouverte sur le détroit, piscine à débordement et jardin paysager.",
    features: ["Vue mer panoramique", "Piscine à débordement", "Domotique intégrale", "Garage double"],
    gradient: "from-anthracite-900 via-anthracite-700 to-gold-500/30",
  },
  {
    id: "2",
    slug: "riad-medina-marrakech",
    title: "Riad restauré au cœur de la médina",
    city: "Marrakech",
    type: "Riad",
    status: "Disponible",
    badge: "Coup de cœur",
    price: 4200000,
    currency: "MAD",
    surface: 280,
    bedrooms: 6,
    bathrooms: 5,
    description:
      "Riad d'exception entièrement restauré par des artisans locaux, patio central et terrasse panoramique.",
    features: ["Patio traditionnel", "Terrasse vue Atlas", "Hammam privé", "Restauration artisanale"],
    gradient: "from-gold-600/40 via-anthracite-800 to-anthracite-950",
  },
  {
    id: "3",
    slug: "penthouse-corniche-casablanca",
    title: "Penthouse panoramique sur la Corniche",
    city: "Casablanca",
    type: "Penthouse",
    status: "Off-market",
    badge: "Off-market",
    price: 12900000,
    currency: "MAD",
    surface: 310,
    bedrooms: 4,
    bathrooms: 3,
    description:
      "Dernier étage d'une résidence signature, vue dégagée sur l'océan Atlantique, prestations haut de gamme.",
    features: ["Vue océan à 180°", "Rooftop privatif", "Conciergerie 24/7", "Double parking"],
    gradient: "from-anthracite-950 via-anthracite-800 to-anthracite-600",
  },
  {
    id: "4",
    slug: "duplex-residence-rabat",
    title: "Duplex dans résidence sécurisée",
    city: "Rabat",
    type: "Duplex",
    status: "Disponible",
    badge: "Exclusif",
    price: 5600000,
    currency: "MAD",
    surface: 230,
    bedrooms: 3,
    bathrooms: 2,
    description:
      "Duplex lumineux dans une résidence gardée du quartier Hay Riad, finitions haut standing.",
    features: ["Résidence gardée", "Finitions haut standing", "Parking privé", "Espace bureau"],
    gradient: "from-anthracite-800 via-anthracite-600 to-gold-400/30",
  },
  {
    id: "5",
    slug: "villa-piscine-agadir",
    title: "Villa d'architecte avec piscine à débordement",
    city: "Agadir",
    type: "Villa",
    status: "Réservé",
    price: 6800000,
    currency: "MAD",
    surface: 380,
    bedrooms: 5,
    bathrooms: 4,
    description:
      "Villa signée par un architecte reconnu, à quelques minutes de la plage, jardin tropical entretenu.",
    features: ["Piscine à débordement", "Jardin tropical", "Proche plage", "Suite parentale"],
    gradient: "from-anthracite-900 via-gold-600/20 to-anthracite-700",
  },
  {
    id: "6",
    slug: "maison-hotes-essaouira",
    title: "Maison d'hôtes atypique face à l'océan",
    city: "Essaouira",
    type: "Maison",
    status: "Off-market",
    badge: "Off-market",
    price: 3950000,
    currency: "MAD",
    surface: 260,
    bedrooms: 4,
    bathrooms: 4,
    description:
      "Bâtisse de caractère à deux pas des remparts, exploitable en maison d'hôtes ou résidence secondaire.",
    features: ["Face à l'océan", "Cachet authentique", "Potentiel locatif", "Proche remparts"],
    gradient: "from-anthracite-800 via-anthracite-950 to-gold-500/20",
  },
];

export function formatPrice(price: number, currency: "MAD" = "MAD") {
  return `${new Intl.NumberFormat("fr-FR").format(price)} ${currency}`;
}

export function getCities() {
  const cities = Array.from(new Set(properties.map((property) => property.city)));
  return cities.map((city) => ({
    name: city,
    count: properties.filter((property) => property.city === city).length,
  }));
}

export const propertyTypes: PropertyType[] = [
  "Villa",
  "Riad",
  "Penthouse",
  "Duplex",
  "Maison",
];
