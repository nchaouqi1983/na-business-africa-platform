/**
 * Literal value tuples + French labels for the CRM enums (phase 6G1). Same
 * convention as lib/finance/enum-labels.ts and
 * lib/real-estate-network/enum-labels.ts: plain `as const` tuples so they can
 * feed z.enum() directly, string values kept identical to the Prisma enum
 * members in schema.prisma.
 */

export const prospectTypeValues = ["ACHETEUR", "LOCATAIRE", "VENDEUR", "INVESTISSEUR", "AUTRE"] as const;
export type ProspectTypeValue = (typeof prospectTypeValues)[number];
export const prospectTypeLabels: Record<ProspectTypeValue, string> = {
  ACHETEUR: "Acheteur",
  LOCATAIRE: "Locataire",
  VENDEUR: "Vendeur",
  INVESTISSEUR: "Investisseur",
  AUTRE: "Autre",
};
export const prospectTypeOptions = prospectTypeValues.map((value) => ({ value, label: prospectTypeLabels[value] }));

export const prospectLanguageValues = ["FR", "AR", "EN"] as const;
export type ProspectLanguageValue = (typeof prospectLanguageValues)[number];
export const prospectLanguageLabels: Record<ProspectLanguageValue, string> = {
  FR: "Français",
  AR: "Arabe",
  EN: "Anglais",
};
export const prospectLanguageOptions = prospectLanguageValues.map((value) => ({ value, label: prospectLanguageLabels[value] }));

export const prospectSourceValues = [
  "SITE_WEB",
  "WHATSAPP",
  "TELEPHONE",
  "RECOMMANDATION",
  "RESEAUX_SOCIAUX",
  "PORTAIL",
  "AUTRE",
] as const;
export type ProspectSourceValue = (typeof prospectSourceValues)[number];
export const prospectSourceLabels: Record<ProspectSourceValue, string> = {
  SITE_WEB: "Site web",
  WHATSAPP: "WhatsApp",
  TELEPHONE: "Téléphone",
  RECOMMANDATION: "Recommandation",
  RESEAUX_SOCIAUX: "Réseaux sociaux",
  PORTAIL: "Portail",
  AUTRE: "Autre",
};
export const prospectSourceOptions = prospectSourceValues.map((value) => ({ value, label: prospectSourceLabels[value] }));

export const prospectStatusValues = [
  "NOUVEAU",
  "A_QUALIFIER",
  "QUALIFIE",
  "VISITE_PLANIFIEE",
  "OFFRE",
  "NEGOCIATION",
  "GAGNE",
  "PERDU",
  "ARCHIVE",
] as const;
export type ProspectStatusValue = (typeof prospectStatusValues)[number];
export const prospectStatusLabels: Record<ProspectStatusValue, string> = {
  NOUVEAU: "Nouveau",
  A_QUALIFIER: "À qualifier",
  QUALIFIE: "Qualifié",
  VISITE_PLANIFIEE: "Visite planifiée",
  OFFRE: "Offre",
  NEGOCIATION: "Négociation",
  GAGNE: "Gagné",
  PERDU: "Perdu",
  ARCHIVE: "Archivé",
};
export const prospectStatusOptions = prospectStatusValues.map((value) => ({ value, label: prospectStatusLabels[value] }));

/** Prospects landing in /admin/demandes — freshly captured, not yet qualified. */
export const demandeStatusValues = ["NOUVEAU", "A_QUALIFIER"] as const satisfies readonly ProspectStatusValue[];

/** Which public form (phase 6G2) produced a Prospect — null for a back-office manual entry. */
export const prospectFormOriginValues = ["CONTACT", "VENDRE", "OFF_MARKET"] as const;
export type ProspectFormOriginValue = (typeof prospectFormOriginValues)[number];
export const prospectFormOriginLabels: Record<ProspectFormOriginValue, string> = {
  CONTACT: "Contact",
  VENDRE: "Vendre",
  OFF_MARKET: "Off-market",
};
export const prospectFormOriginOptions = prospectFormOriginValues.map((value) => ({ value, label: prospectFormOriginLabels[value] }));

export const interestLevelValues = ["A_SUIVRE", "INTERESSE", "FAVORI", "REFUSE"] as const;
export type InterestLevelValue = (typeof interestLevelValues)[number];
export const interestLevelLabels: Record<InterestLevelValue, string> = {
  A_SUIVRE: "À suivre",
  INTERESSE: "Intéressé",
  FAVORI: "Favori",
  REFUSE: "Refusé",
};
export const interestLevelOptions = interestLevelValues.map((value) => ({ value, label: interestLevelLabels[value] }));

export const visitStatusValues = ["PLANIFIEE", "CONFIRMEE", "REALISEE", "ANNULEE", "ABSENT"] as const;
export type VisitStatusValue = (typeof visitStatusValues)[number];
export const visitStatusLabels: Record<VisitStatusValue, string> = {
  PLANIFIEE: "Planifiée",
  CONFIRMEE: "Confirmée",
  REALISEE: "Réalisée",
  ANNULEE: "Annulée",
  ABSENT: "Absent",
};
export const visitStatusOptions = visitStatusValues.map((value) => ({ value, label: visitStatusLabels[value] }));

export const visitTypeValues = ["PREMIERE_VISITE", "REVISITE", "VISITE_PROPRIETAIRE", "AUTRE"] as const;
export type VisitTypeValue = (typeof visitTypeValues)[number];
export const visitTypeLabels: Record<VisitTypeValue, string> = {
  PREMIERE_VISITE: "Première visite",
  REVISITE: "Revisite",
  VISITE_PROPRIETAIRE: "Visite propriétaire",
  AUTRE: "Autre",
};
export const visitTypeOptions = visitTypeValues.map((value) => ({ value, label: visitTypeLabels[value] }));

export const postVisitInterestValues = ["AUCUN", "FAIBLE", "MOYEN", "FORT", "OFFRE_ENVISAGEE"] as const;
export type PostVisitInterestValue = (typeof postVisitInterestValues)[number];
export const postVisitInterestLabels: Record<PostVisitInterestValue, string> = {
  AUCUN: "Aucun",
  FAIBLE: "Faible",
  MOYEN: "Moyen",
  FORT: "Fort",
  OFFRE_ENVISAGEE: "Offre envisagée",
};
export const postVisitInterestOptions = postVisitInterestValues.map((value) => ({ value, label: postVisitInterestLabels[value] }));

export const activityTypeValues = ["APPEL", "WHATSAPP", "EMAIL", "NOTE", "TACHE", "RELANCE"] as const;
export type ActivityTypeValue = (typeof activityTypeValues)[number];
export const activityTypeLabels: Record<ActivityTypeValue, string> = {
  APPEL: "Appel",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  NOTE: "Note",
  TACHE: "Tâche",
  RELANCE: "Relance",
};
export const activityTypeOptions = activityTypeValues.map((value) => ({ value, label: activityTypeLabels[value] }));

export const activityStatusValues = ["A_FAIRE", "TERMINEE", "ANNULEE"] as const;
export type ActivityStatusValue = (typeof activityStatusValues)[number];
export const activityStatusLabels: Record<ActivityStatusValue, string> = {
  A_FAIRE: "À faire",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};
export const activityStatusOptions = activityStatusValues.map((value) => ({ value, label: activityStatusLabels[value] }));

/** Internal notification kinds (phase 6H1) — see lib/crm/notification-service.ts. */
export const notificationTypeValues = [
  "NOUVELLE_DEMANDE",
  "RELANCE_AUJOURD_HUI",
  "RELANCE_EN_RETARD",
  "VISITE_A_VENIR",
  "VISITE_MODIFIEE",
  "VISITE_ANNULEE",
  "PROSPECT_ASSIGNE",
] as const;
export type NotificationTypeValue = (typeof notificationTypeValues)[number];
export const notificationTypeLabels: Record<NotificationTypeValue, string> = {
  NOUVELLE_DEMANDE: "Nouvelle demande",
  RELANCE_AUJOURD_HUI: "Relance aujourd'hui",
  RELANCE_EN_RETARD: "Relance en retard",
  VISITE_A_VENIR: "Visite à venir",
  VISITE_MODIFIEE: "Visite modifiée",
  VISITE_ANNULEE: "Visite annulée",
  PROSPECT_ASSIGNE: "Prospect assigné",
};
