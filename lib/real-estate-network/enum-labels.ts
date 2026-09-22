/**
 * Literal value tuples + French labels for the real-estate network enums.
 * Defined as plain `as const` tuples (same convention as
 * lib/property-schema.ts) rather than derived from the generated Prisma
 * enum objects, so they can feed z.enum() directly. The string values are
 * kept identical to the Prisma enum members in schema.prisma.
 */

export const partyKindValues = ["PHYSIQUE", "SOCIETE"] as const;
export type PartyKindValue = (typeof partyKindValues)[number];
export const partyKindLabels: Record<PartyKindValue, string> = {
  PHYSIQUE: "Personne physique",
  SOCIETE: "Société",
};
export const partyKindOptions = partyKindValues.map((value) => ({ value, label: partyKindLabels[value] }));

export const contactPreferenceValues = ["TELEPHONE", "EMAIL", "WHATSAPP", "COURRIER"] as const;
export type ContactPreferenceValue = (typeof contactPreferenceValues)[number];
export const contactPreferenceLabels: Record<ContactPreferenceValue, string> = {
  TELEPHONE: "Téléphone",
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
  COURRIER: "Courrier",
};
export const contactPreferenceOptions = contactPreferenceValues.map((value) => ({
  value,
  label: contactPreferenceLabels[value],
}));

export const programStatusValues = ["ETUDE", "COMMERCIALISATION", "LIVRE", "SUSPENDU"] as const;
export type ProgramStatusValue = (typeof programStatusValues)[number];
export const programStatusLabels: Record<ProgramStatusValue, string> = {
  ETUDE: "À l'étude",
  COMMERCIALISATION: "Commercialisation",
  LIVRE: "Livré",
  SUSPENDU: "Suspendu",
};
export const programStatusOptions = programStatusValues.map((value) => ({ value, label: programStatusLabels[value] }));

export const lotStatusValues = ["DISPONIBLE", "OPTIONNE", "RESERVE", "VENDU"] as const;
export type LotStatusValue = (typeof lotStatusValues)[number];
export const lotStatusLabels: Record<LotStatusValue, string> = {
  DISPONIBLE: "Disponible",
  OPTIONNE: "Optionné",
  RESERVE: "Réservé",
  VENDU: "Vendu",
};
export const lotStatusOptions = lotStatusValues.map((value) => ({ value, label: lotStatusLabels[value] }));

export const intermediaryTypeValues = ["APPORTEUR", "AGENCE_PARTENAIRE", "COURTIER", "NOTAIRE", "AUTRE"] as const;
export type IntermediaryTypeValue = (typeof intermediaryTypeValues)[number];
export const intermediaryTypeLabels: Record<IntermediaryTypeValue, string> = {
  APPORTEUR: "Apporteur d'affaires",
  AGENCE_PARTENAIRE: "Agence partenaire",
  COURTIER: "Courtier",
  NOTAIRE: "Notaire",
  AUTRE: "Autre",
};
export const intermediaryTypeOptions = intermediaryTypeValues.map((value) => ({
  value,
  label: intermediaryTypeLabels[value],
}));

export const propertyOwnerRoleValues = ["PROPRIETAIRE", "INDIVISAIRE", "USUFRUITIER", "MANDATAIRE", "AUTRE"] as const;
export type PropertyOwnerRoleValue = (typeof propertyOwnerRoleValues)[number];
export const propertyOwnerRoleLabels: Record<PropertyOwnerRoleValue, string> = {
  PROPRIETAIRE: "Propriétaire",
  INDIVISAIRE: "Indivisaire",
  USUFRUITIER: "Usufruitier",
  MANDATAIRE: "Mandataire",
  AUTRE: "Autre",
};
export const propertyOwnerRoleOptions = propertyOwnerRoleValues.map((value) => ({
  value,
  label: propertyOwnerRoleLabels[value],
}));

export const commissionTypeValues = ["POURCENTAGE", "FORFAIT"] as const;
export type CommissionTypeValue = (typeof commissionTypeValues)[number];
export const commissionTypeLabels: Record<CommissionTypeValue, string> = {
  POURCENTAGE: "Pourcentage",
  FORFAIT: "Forfait",
};
export const commissionTypeOptions = commissionTypeValues.map((value) => ({ value, label: commissionTypeLabels[value] }));
