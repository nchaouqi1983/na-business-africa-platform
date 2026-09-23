/**
 * Shared 360° dashboard shape for Owner/Promoter/Intermediary detail pages
 * (phase 6K §4). commissionsPrevues/commissionsEncaissees are null when the
 * viewer isn't SUPER_ADMIN/ADMIN — the query layer skips those aggregates
 * entirely rather than computing and hiding them.
 */
export type NetworkEntityStats = {
  propertiesTotal: number;
  propertiesPublished: number;
  propertiesDraft: number;
  propertiesOffMarket: number;
  activeMandates: number;
  prospectsInterested: number;
  visitsScheduled: number;
  visitsCompleted: number;
  /** Phase 6L — opportunities on the linked biens. pipelineVolume = Σ estimated DEAL amounts of the open ones, never revenue. */
  opportunitiesOpen: number;
  opportunitiesWon: number;
  opportunitiesLost: number;
  pipelineVolume: number;
  commissionsPrevues: number | null;
  commissionsEncaissees: number | null;
};
