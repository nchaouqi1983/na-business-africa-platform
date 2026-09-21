// Imported from the standalone enums module (not "@/lib/generated/prisma/client")
// on purpose: this file is pulled into client-side form components, and the
// full client entrypoint drags in the Node-only query engine runtime, which
// Turbopack cannot put in a browser bundle.
import {
  PropertyTransaction as DbTransaction,
  PropertyType as DbPropertyType,
  PropertyStatus as DbPropertyStatus,
  PublicationStatus as DbPublicationStatus,
  Visibility as DbVisibility,
  FurnishedState as DbFurnishedState,
  PropertyCondition as DbPropertyCondition,
  Orientation as DbOrientation,
  TagCategory as DbTagCategory,
} from "@/lib/generated/prisma/enums";
import {
  transactionValues,
  transactionLabels,
  type TransactionType,
  propertyTypeValues,
  propertyTypeLabels,
  type PropertyType,
  propertySubTypesByType,
  commercialStatusLabels,
  furnishedValues,
  furnishedLabels,
  type FurnishedState,
  conditionValues,
  conditionLabels,
  type PropertyCondition,
  orientationValues,
  orientationLabels,
  type Orientation,
  type TagCategory,
} from "@/lib/property-schema";

/**
 * Conversion between the public catalogue's kebab-case slugs
 * (lib/property-schema.ts) and the Prisma enum identifiers Postgres actually
 * stores. Prisma exposes the enum *identifier* at runtime regardless of any
 * `@map`, so this mapping is required wherever the admin layer talks to both
 * vocabularies.
 */

export const transactionToDb: Record<TransactionType, DbTransaction> = {
  vente: DbTransaction.VENTE,
  location: DbTransaction.LOCATION,
  "location-saisonniere": DbTransaction.LOCATION_SAISONNIERE,
  "programme-neuf": DbTransaction.PROGRAMME_NEUF,
};

export const transactionFromDb: Record<DbTransaction, TransactionType> = {
  [DbTransaction.VENTE]: "vente",
  [DbTransaction.LOCATION]: "location",
  [DbTransaction.LOCATION_SAISONNIERE]: "location-saisonniere",
  [DbTransaction.PROGRAMME_NEUF]: "programme-neuf",
};

export const transactionOptions = transactionValues.map((value) => ({
  value,
  label: transactionLabels[value],
}));

export const propertyTypeToDb: Record<PropertyType, DbPropertyType> = {
  villa: DbPropertyType.VILLA,
  maison: DbPropertyType.MAISON,
  riad: DbPropertyType.RIAD,
  appartement: DbPropertyType.APPARTEMENT,
  duplex: DbPropertyType.DUPLEX,
  penthouse: DbPropertyType.PENTHOUSE,
  terrain: DbPropertyType.TERRAIN,
  hotel: DbPropertyType.HOTEL,
  "maison-hotes": DbPropertyType.MAISON_HOTES,
  restaurant: DbPropertyType.RESTAURANT,
  commerce: DbPropertyType.COMMERCE,
  bureau: DbPropertyType.BUREAU,
  depot: DbPropertyType.DEPOT,
  "fonds-de-commerce": DbPropertyType.FONDS_DE_COMMERCE,
  "programme-neuf": DbPropertyType.PROGRAMME_NEUF,
};

export const propertyTypeFromDb: Record<DbPropertyType, PropertyType> = {
  [DbPropertyType.VILLA]: "villa",
  [DbPropertyType.MAISON]: "maison",
  [DbPropertyType.RIAD]: "riad",
  [DbPropertyType.APPARTEMENT]: "appartement",
  [DbPropertyType.DUPLEX]: "duplex",
  [DbPropertyType.PENTHOUSE]: "penthouse",
  [DbPropertyType.TERRAIN]: "terrain",
  [DbPropertyType.HOTEL]: "hotel",
  [DbPropertyType.MAISON_HOTES]: "maison-hotes",
  [DbPropertyType.RESTAURANT]: "restaurant",
  [DbPropertyType.COMMERCE]: "commerce",
  [DbPropertyType.BUREAU]: "bureau",
  [DbPropertyType.DEPOT]: "depot",
  [DbPropertyType.FONDS_DE_COMMERCE]: "fonds-de-commerce",
  [DbPropertyType.PROGRAMME_NEUF]: "programme-neuf",
};

export const propertyTypeOptions = propertyTypeValues.map((value) => ({
  value,
  label: propertyTypeLabels[value],
}));

/** Same labels, keyed by the Prisma enum identifier — for admin filter <select>s
 * that query the database directly rather than going through a public slug. */
export const transactionFilterOptions = transactionOptions.map((option) => ({
  value: transactionToDb[option.value],
  label: option.label,
}));

export const propertyTypeFilterOptions = propertyTypeOptions.map((option) => ({
  value: propertyTypeToDb[option.value],
  label: option.label,
}));

export function subtypeOptionsForType(type: PropertyType | ""): { value: string; label: string }[] {
  return type ? propertySubTypesByType[type] : [];
}

export function isValidSubtype(type: PropertyType, subtype: string): boolean {
  return propertySubTypesByType[type].some((option) => option.value === subtype);
}

/**
 * Statut métier — sous-ensemble volontaire de commercialStatusValues (voir
 * schema.prisma, enum PropertyStatus) : "sous-compromis" et "off-market" ne
 * sont pas repris, off-market étant désormais couvert par Visibility.
 */
export const propertyStatusValues = ["disponible", "reserve", "vendu", "loue", "retire"] as const;
export type PropertyBusinessStatus = (typeof propertyStatusValues)[number];

export const propertyStatusLabels: Record<PropertyBusinessStatus, string> = {
  disponible: commercialStatusLabels.disponible,
  reserve: commercialStatusLabels.reserve,
  vendu: commercialStatusLabels.vendu,
  loue: commercialStatusLabels.loue,
  retire: commercialStatusLabels.retire,
};

export const propertyStatusOptions = propertyStatusValues.map((value) => ({
  value,
  label: propertyStatusLabels[value],
}));

export const propertyStatusToDb: Record<PropertyBusinessStatus, DbPropertyStatus> = {
  disponible: DbPropertyStatus.DISPONIBLE,
  reserve: DbPropertyStatus.RESERVE,
  vendu: DbPropertyStatus.VENDU,
  loue: DbPropertyStatus.LOUE,
  retire: DbPropertyStatus.RETIRE,
};

export const propertyStatusFromDb: Record<DbPropertyStatus, PropertyBusinessStatus> = {
  [DbPropertyStatus.DISPONIBLE]: "disponible",
  [DbPropertyStatus.RESERVE]: "reserve",
  [DbPropertyStatus.VENDU]: "vendu",
  [DbPropertyStatus.LOUE]: "loue",
  [DbPropertyStatus.RETIRE]: "retire",
};

/** Nouveaux concepts back-office, sans équivalent dans le contrat public. */
export const publicationStatusLabels: Record<DbPublicationStatus, string> = {
  BROUILLON: "Brouillon",
  PUBLIE: "Publié",
  ARCHIVE: "Archivé",
};

export const publicationStatusOptions = (
  Object.keys(publicationStatusLabels) as DbPublicationStatus[]
).map((value) => ({ value, label: publicationStatusLabels[value] }));

export const visibilityLabels: Record<DbVisibility, string> = {
  PUBLIC: "Public",
  OFF_MARKET: "Off-market",
  PRIVE: "Privé",
};

export const visibilityValues = Object.keys(visibilityLabels) as [DbVisibility, ...DbVisibility[]];

export const visibilityOptions = visibilityValues.map((value) => ({
  value,
  label: visibilityLabels[value],
}));

export const furnishedToDb: Record<FurnishedState, DbFurnishedState> = {
  meuble: DbFurnishedState.MEUBLE,
  "semi-meuble": DbFurnishedState.SEMI_MEUBLE,
  "non-meuble": DbFurnishedState.NON_MEUBLE,
};

export const furnishedFromDb: Record<DbFurnishedState, FurnishedState> = {
  [DbFurnishedState.MEUBLE]: "meuble",
  [DbFurnishedState.SEMI_MEUBLE]: "semi-meuble",
  [DbFurnishedState.NON_MEUBLE]: "non-meuble",
};

export const furnishedOptions = furnishedValues.map((value) => ({ value, label: furnishedLabels[value] }));

export const conditionToDb: Record<PropertyCondition, DbPropertyCondition> = {
  neuf: DbPropertyCondition.NEUF,
  excellent: DbPropertyCondition.EXCELLENT,
  "bon-etat": DbPropertyCondition.BON_ETAT,
  "a-rafraichir": DbPropertyCondition.A_RAFRAICHIR,
  "a-renover": DbPropertyCondition.A_RENOVER,
  "a-demolir": DbPropertyCondition.A_DEMOLIR,
};

export const conditionFromDb: Record<DbPropertyCondition, PropertyCondition> = {
  [DbPropertyCondition.NEUF]: "neuf",
  [DbPropertyCondition.EXCELLENT]: "excellent",
  [DbPropertyCondition.BON_ETAT]: "bon-etat",
  [DbPropertyCondition.A_RAFRAICHIR]: "a-rafraichir",
  [DbPropertyCondition.A_RENOVER]: "a-renover",
  [DbPropertyCondition.A_DEMOLIR]: "a-demolir",
};

export const conditionOptions = conditionValues.map((value) => ({ value, label: conditionLabels[value] }));

export const orientationToDb: Record<Orientation, DbOrientation> = {
  nord: DbOrientation.NORD,
  sud: DbOrientation.SUD,
  est: DbOrientation.EST,
  ouest: DbOrientation.OUEST,
  "nord-est": DbOrientation.NORD_EST,
  "nord-ouest": DbOrientation.NORD_OUEST,
  "sud-est": DbOrientation.SUD_EST,
  "sud-ouest": DbOrientation.SUD_OUEST,
};

export const orientationFromDb: Record<DbOrientation, Orientation> = {
  [DbOrientation.NORD]: "nord",
  [DbOrientation.SUD]: "sud",
  [DbOrientation.EST]: "est",
  [DbOrientation.OUEST]: "ouest",
  [DbOrientation.NORD_EST]: "nord-est",
  [DbOrientation.NORD_OUEST]: "nord-ouest",
  [DbOrientation.SUD_EST]: "sud-est",
  [DbOrientation.SUD_OUEST]: "sud-ouest",
};

export const orientationOptions = orientationValues.map((value) => ({ value, label: orientationLabels[value] }));

export const tagCategoryToDb: Record<TagCategory, DbTagCategory> = {
  exterieur: DbTagCategory.EXTERIEUR,
  confort: DbTagCategory.CONFORT,
  securite: DbTagCategory.SECURITE,
  loisirs: DbTagCategory.LOISIRS,
  technique: DbTagCategory.TECHNIQUE,
  juridique: DbTagCategory.JURIDIQUE,
  marketing: DbTagCategory.MARKETING,
  vue: DbTagCategory.VUE,
  environnement: DbTagCategory.ENVIRONNEMENT,
  proximite: DbTagCategory.PROXIMITE,
};

export const tagCategoryFromDb: Record<DbTagCategory, TagCategory> = {
  [DbTagCategory.EXTERIEUR]: "exterieur",
  [DbTagCategory.CONFORT]: "confort",
  [DbTagCategory.SECURITE]: "securite",
  [DbTagCategory.LOISIRS]: "loisirs",
  [DbTagCategory.TECHNIQUE]: "technique",
  [DbTagCategory.JURIDIQUE]: "juridique",
  [DbTagCategory.MARKETING]: "marketing",
  [DbTagCategory.VUE]: "vue",
  [DbTagCategory.ENVIRONNEMENT]: "environnement",
  [DbTagCategory.PROXIMITE]: "proximite",
};

export const tagCategoryLabels: Record<TagCategory, string> = {
  exterieur: "Extérieur",
  confort: "Confort",
  securite: "Sécurité",
  loisirs: "Loisirs",
  technique: "Technique",
  juridique: "Juridique / investissement",
  marketing: "Arguments marketing",
  vue: "Vues",
  environnement: "Environnement",
  proximite: "Proximité",
};

export const tagCategoryOptions = (Object.keys(tagCategoryLabels) as TagCategory[]).map((value) => ({
  value,
  label: tagCategoryLabels[value],
}));
