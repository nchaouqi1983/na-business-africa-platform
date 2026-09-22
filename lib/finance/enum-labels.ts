/**
 * Literal value tuples + French labels for the mandates/commissions enums
 * (phase 6F). Same convention as lib/real-estate-network/enum-labels.ts:
 * plain `as const` tuples so they can feed z.enum() directly, string values
 * kept identical to the Prisma enum members in schema.prisma.
 */

export const mandateTypeValues = ["VENTE", "LOCATION", "EXCLUSIF", "SIMPLE", "OFF_MARKET"] as const;
export type MandateTypeValue = (typeof mandateTypeValues)[number];
export const mandateTypeLabels: Record<MandateTypeValue, string> = {
  VENTE: "Vente",
  LOCATION: "Location",
  EXCLUSIF: "Exclusif",
  SIMPLE: "Simple",
  OFF_MARKET: "Off-market",
};
export const mandateTypeOptions = mandateTypeValues.map((value) => ({ value, label: mandateTypeLabels[value] }));

export const mandateStatusValues = ["BROUILLON", "ACTIF", "EXPIRE", "RESILIE", "FINALISE"] as const;
export type MandateStatusValue = (typeof mandateStatusValues)[number];
export const mandateStatusLabels: Record<MandateStatusValue, string> = {
  BROUILLON: "Brouillon",
  ACTIF: "Actif",
  EXPIRE: "Expiré",
  RESILIE: "Résilié",
  FINALISE: "Finalisé",
};
export const mandateStatusOptions = mandateStatusValues.map((value) => ({ value, label: mandateStatusLabels[value] }));

export const commissionTransactionTypeValues = ["VENTE", "LOCATION"] as const;
export type CommissionTransactionTypeValue = (typeof commissionTransactionTypeValues)[number];
export const commissionTransactionTypeLabels: Record<CommissionTransactionTypeValue, string> = {
  VENTE: "Vente",
  LOCATION: "Location",
};
export const commissionTransactionTypeOptions = commissionTransactionTypeValues.map((value) => ({
  value,
  label: commissionTransactionTypeLabels[value],
}));

export const commissionCaseStatusValues = [
  "PREVISION",
  "A_CONFIRMER",
  "DUE",
  "PARTIELLEMENT_PAYEE",
  "PAYEE",
  "ANNULEE",
] as const;
export type CommissionCaseStatusValue = (typeof commissionCaseStatusValues)[number];
export const commissionCaseStatusLabels: Record<CommissionCaseStatusValue, string> = {
  PREVISION: "Prévision",
  A_CONFIRMER: "À confirmer",
  DUE: "Due",
  PARTIELLEMENT_PAYEE: "Partiellement payée",
  PAYEE: "Payée",
  ANNULEE: "Annulée",
};
export const commissionCaseStatusOptions = commissionCaseStatusValues.map((value) => ({
  value,
  label: commissionCaseStatusLabels[value],
}));

export const commissionBasisValues = ["PRIX_FINAL", "LOYER_ANNUEL", "MONTANT_FIXE"] as const;
export type CommissionBasisValue = (typeof commissionBasisValues)[number];
export const commissionBasisLabels: Record<CommissionBasisValue, string> = {
  PRIX_FINAL: "Prix final",
  LOYER_ANNUEL: "Loyer annuel",
  MONTANT_FIXE: "Montant fixe",
};
export const commissionBasisOptions = commissionBasisValues.map((value) => ({ value, label: commissionBasisLabels[value] }));

export const commissionBilledToValues = ["VENDEUR", "ACQUEREUR", "LOCATAIRE"] as const;
export type CommissionBilledToValue = (typeof commissionBilledToValues)[number];
export const commissionBilledToLabels: Record<CommissionBilledToValue, string> = {
  VENDEUR: "Vendeur",
  ACQUEREUR: "Acquéreur",
  LOCATAIRE: "Locataire",
};
export const commissionBilledToOptions = commissionBilledToValues.map((value) => ({
  value,
  label: commissionBilledToLabels[value],
}));

export const commissionBeneficiaryTypeValues = ["AGENCE", "INTERMEDIAIRE", "AGENT_INTERNE", "AUTRE"] as const;
export type CommissionBeneficiaryTypeValue = (typeof commissionBeneficiaryTypeValues)[number];
export const commissionBeneficiaryTypeLabels: Record<CommissionBeneficiaryTypeValue, string> = {
  AGENCE: "Agence",
  INTERMEDIAIRE: "Intermédiaire",
  AGENT_INTERNE: "Agent interne",
  AUTRE: "Autre",
};
export const commissionBeneficiaryTypeOptions = commissionBeneficiaryTypeValues.map((value) => ({
  value,
  label: commissionBeneficiaryTypeLabels[value],
}));

export const commissionShareModeValues = ["POURCENTAGE", "MONTANT_FIXE"] as const;
export type CommissionShareModeValue = (typeof commissionShareModeValues)[number];
export const commissionShareModeLabels: Record<CommissionShareModeValue, string> = {
  POURCENTAGE: "Pourcentage",
  MONTANT_FIXE: "Montant fixe",
};
export const commissionShareModeOptions = commissionShareModeValues.map((value) => ({
  value,
  label: commissionShareModeLabels[value],
}));

export const commissionShareStatusValues = ["PREVU", "VALIDE", "PAYE"] as const;
export type CommissionShareStatusValue = (typeof commissionShareStatusValues)[number];
export const commissionShareStatusLabels: Record<CommissionShareStatusValue, string> = {
  PREVU: "Prévu",
  VALIDE: "Validé",
  PAYE: "Payé",
};
export const commissionShareStatusOptions = commissionShareStatusValues.map((value) => ({
  value,
  label: commissionShareStatusLabels[value],
}));

export const commissionPaymentStatusValues = ["PREVU", "RECU", "PARTIEL", "ANNULE"] as const;
export type CommissionPaymentStatusValue = (typeof commissionPaymentStatusValues)[number];
export const commissionPaymentStatusLabels: Record<CommissionPaymentStatusValue, string> = {
  PREVU: "Prévu",
  RECU: "Reçu",
  PARTIEL: "Partiel",
  ANNULE: "Annulé",
};
export const commissionPaymentStatusOptions = commissionPaymentStatusValues.map((value) => ({
  value,
  label: commissionPaymentStatusLabels[value],
}));
