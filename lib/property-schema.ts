// Contrat de données immobilier — NA Business Africa
// Aucune base de données ni API : ce fichier définit les types, les listes de
// référence, la taxonomie de tags et la configuration déclarative des filtres
// publics utilisés par le catalogue /explorer.

export type LocalizedText = {
  fr: string;
  en: string;
};

// ---------------------------------------------------------------------------
// A. Identification et publication
// ---------------------------------------------------------------------------

export const propertyTypeValues = [
  "villa",
  "maison",
  "riad",
  "appartement",
  "duplex",
  "penthouse",
  "terrain",
  "hotel",
  "maison-hotes",
  "restaurant",
  "commerce",
  "bureau",
  "depot",
  "fonds-de-commerce",
  "programme-neuf",
] as const;
export type PropertyType = (typeof propertyTypeValues)[number];

export const propertyTypeLabels: Record<PropertyType, string> = {
  villa: "Villa",
  maison: "Maison",
  riad: "Riad",
  appartement: "Appartement",
  duplex: "Duplex",
  penthouse: "Penthouse",
  terrain: "Terrain",
  hotel: "Hôtel",
  "maison-hotes": "Maison d'hôtes",
  restaurant: "Restaurant",
  commerce: "Commerce",
  bureau: "Bureau",
  depot: "Dépôt",
  "fonds-de-commerce": "Fonds de commerce",
  "programme-neuf": "Programme neuf",
};

/** Regroupe les types de biens partageant les mêmes champs conditionnels (section F). */
export type PropertyTypeGroup =
  | "villa-maison-riad"
  | "appartement-duplex-penthouse"
  | "terrain"
  | "hotel-maison-hotes"
  | "commerce-bureau-depot"
  | "programme-neuf";

export const propertyTypeGroup: Record<PropertyType, PropertyTypeGroup> = {
  villa: "villa-maison-riad",
  maison: "villa-maison-riad",
  riad: "villa-maison-riad",
  appartement: "appartement-duplex-penthouse",
  duplex: "appartement-duplex-penthouse",
  penthouse: "appartement-duplex-penthouse",
  terrain: "terrain",
  hotel: "hotel-maison-hotes",
  "maison-hotes": "hotel-maison-hotes",
  restaurant: "commerce-bureau-depot",
  commerce: "commerce-bureau-depot",
  bureau: "commerce-bureau-depot",
  depot: "commerce-bureau-depot",
  "fonds-de-commerce": "commerce-bureau-depot",
  "programme-neuf": "programme-neuf",
};

export const propertySubTypesByType: Record<PropertyType, { value: string; label: string }[]> = {
  villa: [
    { value: "villa-moderne", label: "Villa moderne" },
    { value: "villa-traditionnelle", label: "Villa traditionnelle" },
    { value: "villa-piscine", label: "Villa avec piscine" },
    { value: "villa-vue-mer", label: "Villa vue mer" },
  ],
  maison: [
    { value: "maison-ville", label: "Maison de ville" },
    { value: "maison-contemporaine", label: "Maison contemporaine" },
  ],
  riad: [
    { value: "riad-medina", label: "Riad médina" },
    { value: "riad-restaure", label: "Riad restauré" },
    { value: "riad-piscine", label: "Riad avec piscine" },
  ],
  appartement: [
    { value: "appartement-standing", label: "Appartement standing" },
    { value: "appartement-vue-mer", label: "Appartement vue mer" },
    { value: "studio", label: "Studio" },
  ],
  duplex: [
    { value: "duplex-standing", label: "Duplex standing" },
    { value: "duplex-terrasse", label: "Duplex avec terrasse" },
  ],
  penthouse: [
    { value: "penthouse-panoramique", label: "Penthouse vue panoramique" },
    { value: "penthouse-rooftop", label: "Penthouse avec rooftop" },
  ],
  terrain: [
    { value: "terrain-constructible", label: "Terrain constructible" },
    { value: "terrain-agricole", label: "Terrain agricole" },
    { value: "terrain-viabilise", label: "Terrain viabilisé" },
    { value: "terrain-golf", label: "Terrain golfique" },
  ],
  hotel: [
    { value: "hotel-boutique", label: "Hôtel boutique" },
    { value: "hotel-charme", label: "Hôtel de charme" },
  ],
  "maison-hotes": [
    { value: "maison-hotes-medina", label: "Maison d'hôtes médina" },
    { value: "maison-hotes-campagne", label: "Maison d'hôtes campagne" },
  ],
  restaurant: [{ value: "restaurant-emplacement", label: "Restaurant emplacement touristique" }],
  commerce: [
    { value: "local-commercial", label: "Local commercial" },
    { value: "showroom", label: "Showroom" },
  ],
  bureau: [
    { value: "bureau-openspace", label: "Bureau open space" },
    { value: "plateau-bureaux", label: "Plateau de bureaux" },
  ],
  depot: [
    { value: "depot-logistique", label: "Dépôt logistique" },
    { value: "entrepot", label: "Entrepôt" },
  ],
  "fonds-de-commerce": [
    { value: "fonds-restauration", label: "Fonds de commerce restauration" },
    { value: "fonds-commerce-detail", label: "Fonds de commerce détail" },
  ],
  "programme-neuf": [
    { value: "appartements-neufs", label: "Appartements neufs" },
    { value: "villas-neuves", label: "Villas neuves" },
    { value: "lots-a-batir", label: "Lots à bâtir" },
  ],
};

export const transactionValues = ["vente", "location", "location-saisonniere", "programme-neuf"] as const;
export type TransactionType = (typeof transactionValues)[number];

export const transactionLabels: Record<TransactionType, string> = {
  vente: "Vente",
  location: "Location",
  "location-saisonniere": "Location saisonnière",
  "programme-neuf": "Programme neuf",
};

export const commercialStatusValues = [
  "disponible",
  "reserve",
  "sous-compromis",
  "vendu",
  "loue",
  "retire",
  "off-market",
] as const;
export type CommercialStatus = (typeof commercialStatusValues)[number];

export const commercialStatusLabels: Record<CommercialStatus, string> = {
  disponible: "Disponible",
  reserve: "Réservé",
  "sous-compromis": "Sous compromis",
  vendu: "Vendu",
  loue: "Loué",
  retire: "Retiré",
  "off-market": "Off Market",
};

export interface PropertyVisibility {
  isPublic: boolean;
  isExclusive: boolean;
  isOffMarket: boolean;
  isCoupDeCoeur: boolean;
  isNew: boolean;
  isBonneAffaire: boolean;
}

export interface PropertyDates {
  entryDate: string;
  publishedAt?: string;
  updatedAt: string;
  expiresAt?: string;
}

export const leadSourceValues = [
  "apporteur",
  "prospection",
  "site-web",
  "reseau",
  "portail",
  "recommandation",
] as const;
export type LeadSource = (typeof leadSourceValues)[number];

export const leadSourceLabels: Record<LeadSource, string> = {
  apporteur: "Apporteur d'affaires",
  prospection: "Prospection",
  "site-web": "Site web",
  reseau: "Réseau agence",
  portail: "Portail immobilier",
  recommandation: "Recommandation client",
};

export interface PropertySeo {
  title: LocalizedText;
  description: LocalizedText;
  displayPriority: number;
}

// ---------------------------------------------------------------------------
// B. Localisation
// ---------------------------------------------------------------------------

export const mapPrecisionValues = ["exacte", "approximative", "masquee"] as const;
export type MapPrecision = (typeof mapPrecisionValues)[number];

export const orientationValues = [
  "nord",
  "sud",
  "est",
  "ouest",
  "nord-est",
  "nord-ouest",
  "sud-est",
  "sud-ouest",
] as const;
export type Orientation = (typeof orientationValues)[number];

export const orientationLabels: Record<Orientation, string> = {
  nord: "Nord",
  sud: "Sud",
  est: "Est",
  ouest: "Ouest",
  "nord-est": "Nord-Est",
  "nord-ouest": "Nord-Ouest",
  "sud-est": "Sud-Est",
  "sud-ouest": "Sud-Ouest",
};

export interface PropertyProximities {
  merKm?: number;
  golfKm?: number;
  centreVilleKm?: number;
  aeroportKm?: number;
  ecoleKm?: number;
  commercesKm?: number;
  autorouteKm?: number;
}

export const proximityFields: { key: keyof PropertyProximities; label: string }[] = [
  { key: "merKm", label: "Mer" },
  { key: "golfKm", label: "Golf" },
  { key: "centreVilleKm", label: "Centre-ville" },
  { key: "aeroportKm", label: "Aéroport" },
  { key: "ecoleKm", label: "École" },
  { key: "commercesKm", label: "Commerces" },
  { key: "autorouteKm", label: "Autoroute" },
];

export interface PropertyLocation {
  country: string;
  region: string;
  city: string;
  district?: string;
  subDistrict?: string;
  /** Adresse précise — usage interne uniquement, jamais affichée publiquement. */
  privateAddress?: string;
  latitude?: number;
  longitude?: number;
  mapPrecision: MapPrecision;
  orientation?: Orientation;
  /** Slugs de tags de catégorie "vue" (voir tagTaxonomy). */
  views: string[];
  /** Slugs de tags de catégorie "environnement" (voir tagTaxonomy). */
  environment: string[];
  proximities: PropertyProximities;
}

export const moroccoRegionsByCity: Record<string, string> = {
  Marrakech: "Marrakech-Safi",
  Casablanca: "Casablanca-Settat",
  Rabat: "Rabat-Salé-Kénitra",
  Tanger: "Tanger-Tétouan-Al Hoceïma",
  Agadir: "Souss-Massa",
  Essaouira: "Marrakech-Safi",
};

// ---------------------------------------------------------------------------
// C. Prix et investissement
// ---------------------------------------------------------------------------

export interface PropertyCommission {
  sellerPercent?: number;
  buyerPercent?: number;
  developerPercent?: number;
  agencyPercent?: number;
}

export const paymentConditionValues = [
  "comptant",
  "credit-bancaire",
  "mourabaha",
  "echelonne-promoteur",
  "reservation-acompte",
] as const;
export type PaymentCondition = (typeof paymentConditionValues)[number];

export const paymentConditionLabels: Record<PaymentCondition, string> = {
  comptant: "Paiement comptant",
  "credit-bancaire": "Crédit bancaire",
  mourabaha: "Mourabaha",
  "echelonne-promoteur": "Échelonné promoteur",
  "reservation-acompte": "Réservation + acompte",
};

export interface PropertyPrice {
  priceMAD?: number;
  priceEUR?: number;
  priceOnRequest: boolean;
  negotiable: boolean;
  /** Prix plancher — usage interne uniquement. */
  minInternalPrice?: number;
  pricePerSqm?: number;
  monthlyRent?: number;
  seasonalNightly?: number;
  seasonalWeekly?: number;
  seasonalMonthly?: number;
  charges?: number;
  syndicFees?: number;
  propertyTax?: number;
  securityDeposit?: number;
  commission: PropertyCommission;
  estimatedYieldPercent?: number;
  creditEligible: boolean;
  mourabahaEligible: boolean;
  paymentConditions: PaymentCondition[];
}

// ---------------------------------------------------------------------------
// D. Surfaces et pièces
// ---------------------------------------------------------------------------

export const conditionValues = ["neuf", "excellent", "bon-etat", "a-rafraichir", "a-renover", "a-demolir"] as const;
export type PropertyCondition = (typeof conditionValues)[number];

export const conditionLabels: Record<PropertyCondition, string> = {
  neuf: "Neuf",
  excellent: "Excellent état",
  "bon-etat": "Bon état",
  "a-rafraichir": "À rafraîchir",
  "a-renover": "À rénover",
  "a-demolir": "À démolir",
};

export const availabilityValues = [
  "immediate",
  "sous-1-mois",
  "sous-3-mois",
  "sous-6-mois",
  "a-la-livraison",
] as const;
export type Availability = (typeof availabilityValues)[number];

export const availabilityLabels: Record<Availability, string> = {
  immediate: "Disponibilité immédiate",
  "sous-1-mois": "Sous 1 mois",
  "sous-3-mois": "Sous 3 mois",
  "sous-6-mois": "Sous 6 mois",
  "a-la-livraison": "À la livraison",
};

export const furnishedValues = ["meuble", "semi-meuble", "non-meuble"] as const;
export type FurnishedState = (typeof furnishedValues)[number];

export const furnishedLabels: Record<FurnishedState, string> = {
  meuble: "Meublé",
  "semi-meuble": "Semi-meublé",
  "non-meuble": "Non meublé",
};

export interface PropertyLayout {
  livingArea?: number;
  builtArea?: number;
  landArea?: number;
  titledArea?: number;
  terraceArea?: number;
  balconyArea?: number;
  gardenArea?: number;
  rooftopArea?: number;
  basementArea?: number;
  parkingArea?: number;

  bedrooms?: number;
  suites?: number;
  bathrooms?: number;
  guestToilets?: number;
  livingRooms?: number;
  kitchens?: number;

  garages?: number;
  parkingSpaces?: number;
  cellar?: boolean;
  storageRoom?: boolean;

  floor?: number;
  totalFloors?: number;
  elevator?: boolean;
  yearBuilt?: number;
  renovationYear?: number;
  condition: PropertyCondition;
  availability: Availability;
  furnished?: FurnishedState;
}

// ---------------------------------------------------------------------------
// E. Équipements par catégories
// ---------------------------------------------------------------------------

export const exteriorEquipmentKeys = [
  "piscine",
  "jardin",
  "terrasse",
  "patio",
  "balcon",
  "rooftop",
  "barbecue",
  "pergola",
  "puits",
] as const;
export type ExteriorEquipmentKey = (typeof exteriorEquipmentKeys)[number];

export const comfortEquipmentKeys = [
  "climatisation",
  "chauffage",
  "cheminee",
  "chauffage-sol",
  "domotique",
  "jacuzzi",
  "hammam",
  "sauna",
] as const;
export type ComfortEquipmentKey = (typeof comfortEquipmentKeys)[number];

export const securityEquipmentKeys = [
  "gardien",
  "alarme",
  "videosurveillance",
  "residence-securisee",
  "portail-electrique",
] as const;
export type SecurityEquipmentKey = (typeof securityEquipmentKeys)[number];

export const leisureEquipmentKeys = ["gym", "spa", "cinema", "tennis", "golf", "salle-jeux"] as const;
export type LeisureEquipmentKey = (typeof leisureEquipmentKeys)[number];

export const technicalEquipmentKeys = [
  "fibre",
  "wifi",
  "panneaux-solaires",
  "generateur",
  "forage",
  "eau",
  "electricite",
] as const;
export type TechnicalEquipmentKey = (typeof technicalEquipmentKeys)[number];

export const legalEquipmentKeys = [
  "titre",
  "vna",
  "constructible",
  "airbnb-autorise",
  "maison-hotes-autorisee",
] as const;
export type LegalEquipmentKey = (typeof legalEquipmentKeys)[number];

export const marketingEquipmentKeys = [
  "rare",
  "prix-revise",
  "vue-exceptionnelle",
  "investissement",
  "exclusivite",
  "nouveau",
  "urgent",
] as const;
export type MarketingEquipmentKey = (typeof marketingEquipmentKeys)[number];

export interface PropertyEquipment {
  exterior: Partial<Record<ExteriorEquipmentKey, boolean>>;
  comfort: Partial<Record<ComfortEquipmentKey, boolean>>;
  security: Partial<Record<SecurityEquipmentKey, boolean>>;
  leisure: Partial<Record<LeisureEquipmentKey, boolean>>;
  technical: Partial<Record<TechnicalEquipmentKey, boolean>>;
  legal: Partial<Record<LegalEquipmentKey, boolean>>;
  marketing: Partial<Record<MarketingEquipmentKey, boolean>>;
}

export interface EquipmentCategoryConfig {
  id: keyof PropertyEquipment;
  label: string;
  options: { key: string; label: string }[];
}

export const equipmentCategories: EquipmentCategoryConfig[] = [
  {
    id: "exterior",
    label: "Extérieur",
    options: [
      { key: "piscine", label: "Piscine" },
      { key: "jardin", label: "Jardin" },
      { key: "terrasse", label: "Terrasse" },
      { key: "patio", label: "Patio" },
      { key: "balcon", label: "Balcon" },
      { key: "rooftop", label: "Rooftop" },
      { key: "barbecue", label: "Barbecue" },
      { key: "pergola", label: "Pergola" },
      { key: "puits", label: "Puits" },
    ],
  },
  {
    id: "comfort",
    label: "Confort",
    options: [
      { key: "climatisation", label: "Climatisation" },
      { key: "chauffage", label: "Chauffage" },
      { key: "cheminee", label: "Cheminée" },
      { key: "chauffage-sol", label: "Chauffage au sol" },
      { key: "domotique", label: "Domotique" },
      { key: "jacuzzi", label: "Jacuzzi" },
      { key: "hammam", label: "Hammam" },
      { key: "sauna", label: "Sauna" },
    ],
  },
  {
    id: "security",
    label: "Sécurité",
    options: [
      { key: "gardien", label: "Gardien" },
      { key: "alarme", label: "Alarme" },
      { key: "videosurveillance", label: "Vidéosurveillance" },
      { key: "residence-securisee", label: "Résidence sécurisée" },
      { key: "portail-electrique", label: "Portail électrique" },
    ],
  },
  {
    id: "leisure",
    label: "Loisirs",
    options: [
      { key: "gym", label: "Salle de sport" },
      { key: "spa", label: "Spa" },
      { key: "cinema", label: "Cinéma" },
      { key: "tennis", label: "Tennis" },
      { key: "golf", label: "Golf" },
      { key: "salle-jeux", label: "Salle de jeux" },
    ],
  },
  {
    id: "technical",
    label: "Technique",
    options: [
      { key: "fibre", label: "Fibre optique" },
      { key: "wifi", label: "WiFi" },
      { key: "panneaux-solaires", label: "Panneaux solaires" },
      { key: "generateur", label: "Générateur" },
      { key: "forage", label: "Forage" },
      { key: "eau", label: "Eau" },
      { key: "electricite", label: "Électricité" },
    ],
  },
  {
    id: "legal",
    label: "Juridique",
    options: [
      { key: "titre", label: "Titré" },
      { key: "vna", label: "VNA" },
      { key: "constructible", label: "Constructible" },
      { key: "airbnb-autorise", label: "Airbnb autorisé" },
      { key: "maison-hotes-autorisee", label: "Maison d'hôtes autorisée" },
    ],
  },
  {
    id: "marketing",
    label: "Arguments",
    options: [
      { key: "rare", label: "Rare" },
      { key: "prix-revise", label: "Prix révisé" },
      { key: "vue-exceptionnelle", label: "Vue exceptionnelle" },
      { key: "investissement", label: "Investissement" },
      { key: "exclusivite", label: "Exclusivité" },
      { key: "nouveau", label: "Nouveau" },
      { key: "urgent", label: "Urgent" },
    ],
  },
];

// ---------------------------------------------------------------------------
// F. Champs conditionnels par type
// ---------------------------------------------------------------------------

export type PropertyDetails =
  | {
      kind: "villa-maison-riad";
      patios?: number;
      staffQuarters?: boolean;
      independentEntrance?: boolean;
      poolOrientation?: Orientation;
    }
  | {
      kind: "appartement-duplex-penthouse";
      residenceName?: string;
      totalUnitsInResidence?: number;
      floorPosition?: "rdc" | "intermediaire" | "dernier-etage";
      concierge?: boolean;
    }
  | {
      kind: "terrain";
      landUse?: "villa" | "immeuble" | "agricole" | "industriel" | "mixte";
      buildingRightsCos?: number;
      buildingRightsCus?: number;
      serviced?: boolean;
      fenced?: boolean;
      titleType?: "titre-foncier" | "melkia" | "requisition-immatriculation";
    }
  | {
      kind: "hotel-maison-hotes";
      roomsCount?: number;
      starRating?: number;
      occupancyRatePercent?: number;
      licenseType?: string;
      restaurantOnSite?: boolean;
    }
  | {
      kind: "commerce-bureau-depot";
      activityType?: string;
      footTraffic?: "faible" | "moyen" | "eleve";
      storefrontWidthMeters?: number;
      ceilingHeightMeters?: number;
      goodwillIncluded?: boolean;
    }
  | {
      kind: "programme-neuf";
      programName?: string;
      developerName?: string;
      deliveryDate?: string;
      lotsTotal?: number;
      lotsAvailable?: number;
      constructionProgressPercent?: number;
    };

// ---------------------------------------------------------------------------
// G. Médias et documents
// ---------------------------------------------------------------------------

export const confidentialityValues = ["public", "interne", "off-market"] as const;
export type MediaConfidentiality = (typeof confidentialityValues)[number];

export interface PropertyMedia {
  coverImage?: string;
  gallery: string[];
  floorPlans?: string[];
  brochurePdf?: string;
  video?: string;
  virtualTour?: string;
  confidentiality: MediaConfidentiality;
  /** Dégradé Tailwind utilisé en absence de photographie réelle (aucune dépendance externe). */
  placeholderGradient: string;
}

// ---------------------------------------------------------------------------
// H. Champs internes non publics
// ---------------------------------------------------------------------------

export interface PropertyInternalHistoryEntry {
  date: string;
  event: string;
}

export interface PropertyInternal {
  ownerName?: string;
  ownerContact?: string;
  mandateType?: "simple" | "exclusif";
  mandateStart?: string;
  mandateEnd?: string;
  minPrice?: number;
  notes?: string;
  documents?: string[];
  history?: PropertyInternalHistoryEntry[];
  referrer?: string;
  commissionRules?: string;
}

// ---------------------------------------------------------------------------
// Structure racine
// ---------------------------------------------------------------------------

export interface Property {
  // A. Identification et publication
  id: string;
  reference: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  transaction: TransactionType;
  type: PropertyType;
  subType?: string;
  commercialStatus: CommercialStatus;
  visibility: PropertyVisibility;
  dates: PropertyDates;
  agentId: string;
  source?: LeadSource;
  ownerId?: string;
  developerId?: string;
  programId?: string;
  lotNumber?: string;
  seo: PropertySeo;

  // B. Localisation
  location: PropertyLocation;

  // C. Prix et investissement
  price: PropertyPrice;

  // D. Surfaces et pièces
  layout: PropertyLayout;

  // E. Équipements
  equipment: PropertyEquipment;

  // F. Champs conditionnels par type
  details?: PropertyDetails;

  // Taxonomie de tags normalisés — slugs validés contre tagTaxonomy, aucun tag libre.
  tags: string[];

  // G. Médias et documents
  media: PropertyMedia;

  // H. Champs internes non publics
  internal?: PropertyInternal;
}

// ---------------------------------------------------------------------------
// 2. Taxonomie de tags normalisés
// ---------------------------------------------------------------------------

export type TagCategory =
  | "exterieur"
  | "confort"
  | "securite"
  | "loisirs"
  | "technique"
  | "juridique"
  | "marketing"
  | "vue"
  | "environnement"
  | "proximite";

export interface PropertyTagDefinition {
  slug: string;
  category: TagCategory;
  label: LocalizedText;
  publicVisible: boolean;
  applicableTypes: PropertyType[] | "all";
}

function equipmentTagCategoryOf(id: keyof PropertyEquipment): TagCategory {
  const map: Record<keyof PropertyEquipment, TagCategory> = {
    exterior: "exterieur",
    comfort: "confort",
    security: "securite",
    leisure: "loisirs",
    technical: "technique",
    legal: "juridique",
    marketing: "marketing",
  };
  return map[id];
}

const equipmentTags: PropertyTagDefinition[] = equipmentCategories.flatMap((category) =>
  category.options.map((option) => ({
    slug: option.key,
    category: equipmentTagCategoryOf(category.id),
    label: { fr: option.label, en: option.label },
    publicVisible: true,
    applicableTypes: "all" as const,
  }))
);

const viewTags: PropertyTagDefinition[] = [
  { slug: "vue-mer", category: "vue", label: { fr: "Vue mer", en: "Sea view" }, publicVisible: true, applicableTypes: "all" },
  { slug: "vue-montagne", category: "vue", label: { fr: "Vue montagne", en: "Mountain view" }, publicVisible: true, applicableTypes: "all" },
  { slug: "vue-golf", category: "vue", label: { fr: "Vue golf", en: "Golf view" }, publicVisible: true, applicableTypes: "all" },
  { slug: "vue-jardin", category: "vue", label: { fr: "Vue jardin", en: "Garden view" }, publicVisible: true, applicableTypes: "all" },
  { slug: "vue-piscine", category: "vue", label: { fr: "Vue piscine", en: "Pool view" }, publicVisible: true, applicableTypes: "all" },
  { slug: "vue-ville", category: "vue", label: { fr: "Vue ville", en: "City view" }, publicVisible: true, applicableTypes: "all" },
  { slug: "vue-medina", category: "vue", label: { fr: "Vue médina", en: "Medina view" }, publicVisible: true, applicableTypes: "all" },
];

const environmentTags: PropertyTagDefinition[] = [
  { slug: "calme", category: "environnement", label: { fr: "Calme", en: "Quiet" }, publicVisible: true, applicableTypes: "all" },
  { slug: "centre-ville", category: "environnement", label: { fr: "Centre-ville", en: "City center" }, publicVisible: true, applicableTypes: "all" },
  { slug: "residentiel", category: "environnement", label: { fr: "Résidentiel", en: "Residential" }, publicVisible: true, applicableTypes: "all" },
  { slug: "bord-de-mer", category: "environnement", label: { fr: "Bord de mer", en: "Seafront" }, publicVisible: true, applicableTypes: "all" },
  { slug: "medina", category: "environnement", label: { fr: "Médina", en: "Medina" }, publicVisible: true, applicableTypes: "all" },
];

const proximityTags: PropertyTagDefinition[] = [
  { slug: "proche-mer", category: "proximite", label: { fr: "Proche mer", en: "Near the sea" }, publicVisible: true, applicableTypes: "all" },
  { slug: "proche-golf", category: "proximite", label: { fr: "Proche golf", en: "Near golf" }, publicVisible: true, applicableTypes: "all" },
  { slug: "proche-centre-ville", category: "proximite", label: { fr: "Proche centre-ville", en: "Near city center" }, publicVisible: true, applicableTypes: "all" },
  { slug: "proche-aeroport", category: "proximite", label: { fr: "Proche aéroport", en: "Near airport" }, publicVisible: true, applicableTypes: "all" },
  { slug: "proche-ecole", category: "proximite", label: { fr: "Proche école", en: "Near school" }, publicVisible: true, applicableTypes: "all" },
  { slug: "proche-commerces", category: "proximite", label: { fr: "Proche commerces", en: "Near shops" }, publicVisible: true, applicableTypes: "all" },
  { slug: "proche-autoroute", category: "proximite", label: { fr: "Proche autoroute", en: "Near highway" }, publicVisible: true, applicableTypes: "all" },
];

/** Taxonomie complète — seuls ces slugs peuvent apparaître dans Property.tags. */
export const tagTaxonomy: PropertyTagDefinition[] = [
  ...equipmentTags,
  ...viewTags,
  ...environmentTags,
  ...proximityTags,
];

const tagTaxonomyBySlug = new Map(tagTaxonomy.map((tag) => [tag.slug, tag]));

export function isKnownTag(slug: string): boolean {
  return tagTaxonomyBySlug.has(slug);
}

export function getTagDefinition(slug: string): PropertyTagDefinition | undefined {
  return tagTaxonomyBySlug.get(slug);
}

export function publicTagsForType(type: PropertyType | ""): PropertyTagDefinition[] {
  return tagTaxonomy.filter(
    (tag) => tag.publicVisible && (tag.applicableTypes === "all" || type === "" || tag.applicableTypes.includes(type))
  );
}

// ---------------------------------------------------------------------------
// 3. Configuration déclarative des filtres publics
// ---------------------------------------------------------------------------

export const sortOptionValues = [
  "pertinence",
  "plus-recent",
  "prix-croissant",
  "prix-decroissant",
  "surface",
  "rendement",
] as const;
export type SortOption = (typeof sortOptionValues)[number];

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: "pertinence", label: "Pertinence" },
  { value: "plus-recent", label: "Plus récent" },
  { value: "prix-croissant", label: "Prix croissant" },
  { value: "prix-decroissant", label: "Prix décroissant" },
  { value: "surface", label: "Surface" },
  { value: "rendement", label: "Rendement" },
];

export type FilterGroupId =
  | "essentiels"
  | "localisation"
  | "surfaces"
  | "etat"
  | "statut"
  | "equipements"
  | "juridique"
  | "programme";

export interface FilterGroupConfig {
  id: FilterGroupId;
  label: string;
  /** true = toujours visible ; false = replié derrière "Plus de filtres". */
  essential: boolean;
}

export const filterGroups: FilterGroupConfig[] = [
  { id: "essentiels", label: "Recherche", essential: true },
  { id: "localisation", label: "Localisation & carte", essential: false },
  { id: "surfaces", label: "Surfaces & pièces", essential: false },
  { id: "etat", label: "État & disponibilité", essential: false },
  { id: "statut", label: "Statut & mise en avant", essential: false },
  { id: "equipements", label: "Équipements & vues", essential: false },
  { id: "juridique", label: "Juridique & investissement", essential: false },
  { id: "programme", label: "Programme neuf", essential: false },
];

/** Groupes de filtres pertinents pour un type de bien donné (filtres dynamiques). */
export function isGroupRelevantForType(groupId: FilterGroupId, type: PropertyType | ""): boolean {
  if (groupId === "programme") {
    return type === "" || type === "programme-neuf";
  }
  if (groupId === "surfaces" || groupId === "etat") {
    return type !== "terrain";
  }
  return true;
}

export interface PropertyFilterState {
  keyword: string;
  transaction: TransactionType | "";
  type: PropertyType | "";
  subType: string;
  city: string;
  district: string;
  proximityKey: keyof PropertyProximities | "";
  proximityMaxKm: string;
  onMapOnly: boolean;
  budgetMin: string;
  budgetMax: string;
  pricePerSqmMax: string;
  surfaceMin: string;
  surfaceMax: string;
  bedroomsMin: string;
  bathroomsMin: string;
  parkingMin: string;
  floor: string;
  condition: PropertyCondition | "";
  furnished: FurnishedState | "";
  availability: Availability | "";
  exclusiveOnly: boolean;
  newOnly: boolean;
  offMarketOnly: boolean;
  priceOnRequestOnly: boolean;
  coupDeCoeurOnly: boolean;
  bonneAffaireOnly: boolean;
  tags: string[];
  legalTitled: boolean;
  airbnbAllowed: boolean;
  creditEligible: boolean;
  mourabahaEligible: boolean;
  minYield: string;
  developerId: string;
  programId: string;
  deliveryBefore: string;
  sort: SortOption;
}

export const defaultFilterState: PropertyFilterState = {
  keyword: "",
  transaction: "",
  type: "",
  subType: "",
  city: "",
  district: "",
  proximityKey: "",
  proximityMaxKm: "",
  onMapOnly: false,
  budgetMin: "",
  budgetMax: "",
  pricePerSqmMax: "",
  surfaceMin: "",
  surfaceMax: "",
  bedroomsMin: "",
  bathroomsMin: "",
  parkingMin: "",
  floor: "",
  condition: "",
  furnished: "",
  availability: "",
  exclusiveOnly: false,
  newOnly: false,
  offMarketOnly: false,
  priceOnRequestOnly: false,
  coupDeCoeurOnly: false,
  bonneAffaireOnly: false,
  tags: [],
  legalTitled: false,
  airbnbAllowed: false,
  creditEligible: false,
  mourabahaEligible: false,
  minYield: "",
  developerId: "",
  programId: "",
  deliveryBefore: "",
  sort: "pertinence",
};

function toNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function matchesKeyword(property: Property, keyword: string): boolean {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    property.title.fr,
    property.title.en,
    property.reference,
    property.location.city,
    property.location.district ?? "",
    propertyTypeLabels[property.type],
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function filterAndSortProperties(properties: Property[], state: PropertyFilterState): Property[] {
  const budgetMin = toNumber(state.budgetMin);
  const budgetMax = toNumber(state.budgetMax);
  const pricePerSqmMax = toNumber(state.pricePerSqmMax);
  const surfaceMin = toNumber(state.surfaceMin);
  const surfaceMax = toNumber(state.surfaceMax);
  const bedroomsMin = toNumber(state.bedroomsMin);
  const bathroomsMin = toNumber(state.bathroomsMin);
  const parkingMin = toNumber(state.parkingMin);
  const floor = toNumber(state.floor);
  const proximityMaxKm = toNumber(state.proximityMaxKm);
  const minYield = toNumber(state.minYield);

  const filtered = properties.filter((property) => {
    if (!property.visibility.isPublic) return false;
    if (!matchesKeyword(property, state.keyword)) return false;
    if (state.transaction && property.transaction !== state.transaction) return false;
    if (state.type && property.type !== state.type) return false;
    if (state.subType && property.subType !== state.subType) return false;
    if (state.city && property.location.city !== state.city) return false;
    if (state.district && property.location.district !== state.district) return false;

    if (state.proximityKey && proximityMaxKm !== undefined) {
      const distance = property.location.proximities[state.proximityKey];
      if (distance === undefined || distance > proximityMaxKm) return false;
    }
    if (state.onMapOnly && (property.location.latitude === undefined || property.location.longitude === undefined)) {
      return false;
    }

    const effectivePrice = property.price.priceMAD;
    if (!state.priceOnRequestOnly) {
      if (budgetMin !== undefined && (effectivePrice === undefined || effectivePrice < budgetMin)) return false;
      if (budgetMax !== undefined && (effectivePrice === undefined || effectivePrice > budgetMax)) return false;
    }
    if (pricePerSqmMax !== undefined) {
      if (property.price.pricePerSqm === undefined || property.price.pricePerSqm > pricePerSqmMax) return false;
    }

    if (surfaceMin !== undefined && (property.layout.livingArea === undefined || property.layout.livingArea < surfaceMin)) {
      return false;
    }
    if (surfaceMax !== undefined && (property.layout.livingArea === undefined || property.layout.livingArea > surfaceMax)) {
      return false;
    }
    if (bedroomsMin !== undefined && (property.layout.bedrooms ?? 0) < bedroomsMin) return false;
    if (bathroomsMin !== undefined && (property.layout.bathrooms ?? 0) < bathroomsMin) return false;
    if (parkingMin !== undefined && (property.layout.parkingSpaces ?? 0) < parkingMin) return false;
    if (floor !== undefined && property.layout.floor !== floor) return false;

    if (state.condition && property.layout.condition !== state.condition) return false;
    if (state.furnished && property.layout.furnished !== state.furnished) return false;
    if (state.availability && property.layout.availability !== state.availability) return false;

    if (state.exclusiveOnly && !property.visibility.isExclusive) return false;
    if (state.newOnly && !property.visibility.isNew) return false;
    if (state.offMarketOnly && !property.visibility.isOffMarket) return false;
    if (state.priceOnRequestOnly && !property.price.priceOnRequest) return false;
    if (state.coupDeCoeurOnly && !property.visibility.isCoupDeCoeur) return false;
    if (state.bonneAffaireOnly && !property.visibility.isBonneAffaire) return false;

    if (state.tags.length > 0) {
      const propertyTags = new Set(property.tags);
      if (!state.tags.every((tag) => propertyTags.has(tag))) return false;
    }

    if (state.legalTitled && !property.equipment.legal.titre) return false;
    if (state.airbnbAllowed && !property.equipment.legal["airbnb-autorise"]) return false;
    if (state.creditEligible && !property.price.creditEligible) return false;
    if (state.mourabahaEligible && !property.price.mourabahaEligible) return false;
    if (minYield !== undefined && (property.price.estimatedYieldPercent ?? 0) < minYield) return false;

    if (state.developerId && property.developerId !== state.developerId) return false;
    if (state.programId && property.programId !== state.programId) return false;
    if (state.deliveryBefore && property.details?.kind === "programme-neuf") {
      if (!property.details.deliveryDate || property.details.deliveryDate > state.deliveryBefore) return false;
    }

    return true;
  });

  const sorted = [...filtered];
  switch (state.sort) {
    case "plus-recent":
      sorted.sort((a, b) => (b.dates.publishedAt ?? b.dates.entryDate).localeCompare(a.dates.publishedAt ?? a.dates.entryDate));
      break;
    case "prix-croissant":
      sorted.sort((a, b) => (a.price.priceMAD ?? Infinity) - (b.price.priceMAD ?? Infinity));
      break;
    case "prix-decroissant":
      sorted.sort((a, b) => (b.price.priceMAD ?? -Infinity) - (a.price.priceMAD ?? -Infinity));
      break;
    case "surface":
      sorted.sort((a, b) => (b.layout.livingArea ?? 0) - (a.layout.livingArea ?? 0));
      break;
    case "rendement":
      sorted.sort((a, b) => (b.price.estimatedYieldPercent ?? 0) - (a.price.estimatedYieldPercent ?? 0));
      break;
    case "pertinence":
    default:
      sorted.sort((a, b) => b.seo.displayPriority - a.seo.displayPriority);
      break;
  }

  return sorted;
}
