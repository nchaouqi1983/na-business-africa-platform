/**
 * Pure business rules + French labels for the Opportunity pipeline (phase
 * 6L). No Prisma runtime import on purpose: this file is shared by Server
 * Actions, queries and the "use client" Kanban board, same convention as
 * lib/crm/enum-labels.ts. String values are kept identical to the Prisma
 * enum members in schema.prisma.
 */

export const opportunityStageValues = [
  "NOUVELLE",
  "QUALIFICATION",
  "MATCHING",
  "VISITE",
  "OFFRE",
  "NEGOCIATION",
  "RESERVATION",
  "COMPROMIS",
  "FINANCEMENT",
  "ACTE",
  "GAGNEE",
  "PERDUE",
] as const;
export type OpportunityStageValue = (typeof opportunityStageValues)[number];

export const opportunityStageLabels: Record<OpportunityStageValue, string> = {
  NOUVELLE: "Nouvelle",
  QUALIFICATION: "Qualification",
  MATCHING: "Matching",
  VISITE: "Visite",
  OFFRE: "Offre",
  NEGOCIATION: "Négociation",
  RESERVATION: "Réservation",
  COMPROMIS: "Compromis",
  FINANCEMENT: "Financement",
  ACTE: "Acte",
  GAGNEE: "Gagnée",
  PERDUE: "Perdue",
};
export const opportunityStageOptions = opportunityStageValues.map((value) => ({ value, label: opportunityStageLabels[value] }));

/**
 * Default win probability (%) per stage — applied on creation and on every
 * stage change. SUPER_ADMIN/ADMIN may override it afterwards on a given
 * opportunity (Opportunity.probabilityIsManual), until its next stage change.
 *
 *   NOUVELLE 5 · QUALIFICATION 10 · MATCHING 20 · VISITE 30 · OFFRE 50 ·
 *   NEGOCIATION 60 · RESERVATION 75 · COMPROMIS 85 · FINANCEMENT 90 ·
 *   ACTE 95 · GAGNEE 100 · PERDUE 0
 */
export const defaultStageProbability: Record<OpportunityStageValue, number> = {
  NOUVELLE: 5,
  QUALIFICATION: 10,
  MATCHING: 20,
  VISITE: 30,
  OFFRE: 50,
  NEGOCIATION: 60,
  RESERVATION: 75,
  COMPROMIS: 85,
  FINANCEMENT: 90,
  ACTE: 95,
  GAGNEE: 100,
  PERDUE: 0,
};

export const closedOpportunityStages = ["GAGNEE", "PERDUE"] as const satisfies readonly OpportunityStageValue[];
export const openOpportunityStages = opportunityStageValues.filter(
  (stage) => !(closedOpportunityStages as readonly string[]).includes(stage)
) as OpportunityStageValue[];

export function isClosedStage(stage: OpportunityStageValue): boolean {
  return stage === "GAGNEE" || stage === "PERDUE";
}

/** From VISITE onward (and for GAGNEE) a bien is mandatory. PERDUE can be reached from any stage, bien or not. */
export function stageRequiresProperty(stage: OpportunityStageValue): boolean {
  if (stage === "PERDUE") return false;
  return opportunityStageValues.indexOf(stage) >= opportunityStageValues.indexOf("VISITE");
}

export const opportunityLossReasonValues = ["PRIX", "FINANCEMENT", "BIEN_INDISPONIBLE", "CONCURRENT", "SANS_REPONSE", "AUTRE"] as const;
export type OpportunityLossReasonValue = (typeof opportunityLossReasonValues)[number];
export const opportunityLossReasonLabels: Record<OpportunityLossReasonValue, string> = {
  PRIX: "Prix",
  FINANCEMENT: "Financement",
  BIEN_INDISPONIBLE: "Bien indisponible",
  CONCURRENT: "Concurrent",
  SANS_REPONSE: "Sans réponse",
  AUTRE: "Autre",
};
export const opportunityLossReasonOptions = opportunityLossReasonValues.map((value) => ({ value, label: opportunityLossReasonLabels[value] }));

/** Days without any activity after which an open opportunity is flagged as dormant. */
export const OPPORTUNITY_INACTIVITY_DAYS = 7;

/** Days before expectedCloseDate from which the "clôture proche" notification fires. */
export const OPPORTUNITY_CLOSE_SOON_DAYS = 7;

/**
 * Weighted forecast of ONE opportunity: estimated deal amount × probability.
 * A deal amount, never agency revenue — see "Prévisionnel pondéré".
 */
export function weightedAmount(estimatedAmount: number | null, probability: number): number {
  if (estimatedAmount === null) return 0;
  return Math.round(estimatedAmount * probability) / 100;
}

/** Same values as the Prisma PropertyTransaction enum identifiers. */
export const opportunityTransactionValues = ["VENTE", "LOCATION", "LOCATION_SAISONNIERE", "PROGRAMME_NEUF"] as const;
export type OpportunityTransactionValue = (typeof opportunityTransactionValues)[number];
export const opportunityTransactionLabels: Record<OpportunityTransactionValue, string> = {
  VENTE: "Vente",
  LOCATION: "Location",
  LOCATION_SAISONNIERE: "Location saisonnière",
  PROGRAMME_NEUF: "Programme neuf",
};
export const opportunityTransactionOptions = opportunityTransactionValues.map((value) => ({ value, label: opportunityTransactionLabels[value] }));

const unavailablePropertyStatusLabels: Record<string, string> = {
  RESERVE: "réservé",
  VENDU: "vendu",
  LOUE: "loué",
  RETIRE: "retiré",
};

/**
 * Alert shown on any OPEN opportunity whose bien is archived or no longer
 * DISPONIBLE (Prisma PropertyStatus/PublicationStatus identifiers). A closed
 * deal on a sold bien is the expected outcome, so no alert once GAGNEE/PERDUE.
 */
export function propertyAvailabilityAlert(
  property: { status: string; publicationStatus: string } | null,
  stage: OpportunityStageValue
): string | null {
  if (!property || isClosedStage(stage)) return null;
  if (property.publicationStatus === "ARCHIVE") return "Bien archivé";
  const label = unavailablePropertyStatusLabels[property.status];
  return label ? `Bien indisponible (${label})` : null;
}

/** Open opportunity with no activity for OPPORTUNITY_INACTIVITY_DAYS days. */
export function isOpportunityDormant(lastActivityAt: Date, stage: OpportunityStageValue, now: Date = new Date()): boolean {
  if (isClosedStage(stage)) return false;
  return lastActivityAt.getTime() < now.getTime() - OPPORTUNITY_INACTIVITY_DAYS * 24 * 60 * 60 * 1000;
}
