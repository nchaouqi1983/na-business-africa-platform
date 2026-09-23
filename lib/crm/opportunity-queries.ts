import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma, OpportunityStage as DbOpportunityStage, PropertyTransaction as DbTransaction, PropertyType as DbPropertyType } from "@/lib/generated/prisma/client";
import { Role } from "@/lib/generated/prisma/enums";
import { opportunityAccessWhere, opportunityOperationalWhere, prospectAccessWhere, type OperationalScope } from "@/lib/crm/permissions";
import {
  opportunityStageValues,
  openOpportunityStages,
  opportunityTransactionValues,
  weightedAmount,
  OPPORTUNITY_INACTIVITY_DAYS,
} from "@/lib/crm/opportunity-rules";

/**
 * Query layer for the Opportunity pipeline (phase 6L). Same contract as
 * lib/crm/prospect-queries.ts: list queries take role/userId and apply
 * opportunityAccessWhere themselves; single-row getters return the
 * createdById/assignedToId fields the caller must check with
 * canViewOpportunity/canEditOpportunity (lib/crm/permissions.ts).
 *
 * Financial rule: every figure computed here from an Opportunity is a DEAL
 * amount (pipeline volume, weighted forecast). Commission figures come only
 * from CommissionCase/CommissionPayment in getCommissionTotals /
 * getOpportunityCommissions, which callers must gate with canManageFinance.
 */

export const OPPORTUNITY_PAGE_SIZE = 20;
/** Upper bound of cards loaded on the Kanban board at once — the table view paginates the rest. */
export const OPPORTUNITY_BOARD_LIMIT = 300;

export type OpportunityListFilters = {
  q?: string;
  stage?: string;
  assignedToId?: string;
  transaction?: string;
  city?: string;
  propertyType?: string;
  closeFrom?: string;
  closeTo?: string;
  prospectId?: string;
  propertyId?: string;
  /** Network filters — ignored unless the caller passes allowNetworkFilters (SUPER_ADMIN/ADMIN). */
  ownerId?: string;
  promoterId?: string;
  intermediaryId?: string;
  page?: number;
};

function isDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function buildOpportunityWhere(
  role: Role,
  userId: string,
  filters: OpportunityListFilters,
  allowNetworkFilters: boolean
): Prisma.OpportunityWhereInput {
  const and: Prisma.OpportunityWhereInput[] = [];

  const accessWhere = opportunityAccessWhere(role, userId);
  if (accessWhere) and.push(accessWhere);

  if (filters.stage && (opportunityStageValues as readonly string[]).includes(filters.stage)) {
    and.push({ stage: filters.stage as DbOpportunityStage });
  } else if (filters.stage === "OUVERTES") {
    and.push({ stage: { in: openOpportunityStages } });
  }
  if (filters.assignedToId) and.push({ assignedToId: filters.assignedToId });
  if (filters.transaction && (opportunityTransactionValues as readonly string[]).includes(filters.transaction)) {
    and.push({ transaction: filters.transaction as DbTransaction });
  }
  if (filters.prospectId) and.push({ prospectId: filters.prospectId });
  if (filters.propertyId) and.push({ propertyId: filters.propertyId });

  const propertyWhere: Prisma.PropertyWhereInput = {};
  if (filters.city) propertyWhere.city = { equals: filters.city, mode: "insensitive" };
  if (filters.propertyType) propertyWhere.propertyType = filters.propertyType as DbPropertyType;
  if (allowNetworkFilters) {
    if (filters.ownerId) propertyWhere.owners = { some: { ownerId: filters.ownerId } };
    if (filters.promoterId) propertyWhere.developmentProgram = { promoterId: filters.promoterId };
    if (filters.intermediaryId) propertyWhere.intermediaries = { some: { intermediaryId: filters.intermediaryId } };
  }
  if (Object.keys(propertyWhere).length > 0) and.push({ property: propertyWhere });

  if (isDate(filters.closeFrom) || isDate(filters.closeTo)) {
    const range: Prisma.DateTimeNullableFilter = {
      ...(isDate(filters.closeFrom) ? { gte: new Date(`${filters.closeFrom}T00:00:00`) } : {}),
      ...(isDate(filters.closeTo) ? { lte: new Date(`${filters.closeTo}T23:59:59`) } : {}),
    };
    // Estimated closing date for open deals, actual one for closed deals.
    and.push({ OR: [{ expectedCloseDate: range }, { closedAt: range }] });
  }

  const q = filters.q?.trim();
  if (q) {
    and.push({
      OR: [
        { reference: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { prospect: { reference: { contains: q, mode: "insensitive" } } },
        { prospect: { firstName: { contains: q, mode: "insensitive" } } },
        { prospect: { lastName: { contains: q, mode: "insensitive" } } },
        { prospect: { companyName: { contains: q, mode: "insensitive" } } },
        { property: { reference: { contains: q, mode: "insensitive" } } },
        { property: { titleFr: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

const opportunityCardInclude = {
  prospect: { select: { id: true, reference: true, firstName: true, lastName: true, companyName: true } },
  property: { select: { id: true, reference: true, titleFr: true, city: true, status: true, publicationStatus: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
} satisfies Prisma.OpportunityInclude;

export async function listOpportunities(role: Role, userId: string, filters: OpportunityListFilters, allowNetworkFilters: boolean) {
  const page = Math.max(1, filters.page ?? 1);
  const where = buildOpportunityWhere(role, userId, filters, allowNetworkFilters);

  const [items, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      include: opportunityCardInclude,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * OPPORTUNITY_PAGE_SIZE,
      take: OPPORTUNITY_PAGE_SIZE,
    }),
    prisma.opportunity.count({ where }),
  ]);

  return { items, total, page, pageSize: OPPORTUNITY_PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / OPPORTUNITY_PAGE_SIZE)) };
}

export async function listOpportunitiesForBoard(role: Role, userId: string, filters: OpportunityListFilters, allowNetworkFilters: boolean) {
  const where = buildOpportunityWhere(role, userId, filters, allowNetworkFilters);
  const [items, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      include: opportunityCardInclude,
      orderBy: [{ expectedCloseDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      take: OPPORTUNITY_BOARD_LIMIT,
    }),
    prisma.opportunity.count({ where }),
  ]);
  return { items, total, truncated: total > items.length };
}

export type PipelineTotals = { openCount: number; pipelineVolume: number; weightedForecast: number };

/**
 * "Volume pipeline" = Σ estimatedAmount of OPEN opportunities.
 * "Prévisionnel pondéré" = Σ (estimatedAmount × probability / 100) of OPEN opportunities.
 * Both are deal amounts — never revenue. Opportunities without an estimated
 * amount count in openCount but add 0 to both sums.
 */
async function computePipelineTotals(where: Prisma.OpportunityWhereInput): Promise<PipelineTotals> {
  const rows = await prisma.opportunity.findMany({
    where: { AND: [where, { stage: { in: openOpportunityStages } }] },
    select: { estimatedAmount: true, probability: true },
  });
  let pipelineVolume = 0;
  let weightedForecast = 0;
  for (const row of rows) {
    const amount = row.estimatedAmount === null ? null : Number(row.estimatedAmount);
    pipelineVolume += amount ?? 0;
    weightedForecast += weightedAmount(amount, row.probability);
  }
  return { openCount: rows.length, pipelineVolume: Math.round(pipelineVolume * 100) / 100, weightedForecast: Math.round(weightedForecast * 100) / 100 };
}

export async function getFilteredPipelineTotals(role: Role, userId: string, filters: OpportunityListFilters, allowNetworkFilters: boolean) {
  return computePipelineTotals(buildOpportunityWhere(role, userId, filters, allowNetworkFilters));
}

export async function getOpportunityById(id: string) {
  return prisma.opportunity.findUnique({
    where: { id },
    include: {
      prospect: {
        select: {
          id: true,
          reference: true,
          kind: true,
          firstName: true,
          lastName: true,
          companyName: true,
          status: true,
          type: true,
          createdById: true,
          assignedToId: true,
        },
      },
      property: {
        select: {
          id: true,
          reference: true,
          titleFr: true,
          city: true,
          district: true,
          status: true,
          publicationStatus: true,
          propertyType: true,
          transaction: true,
          price: true,
          priceOnRequest: true,
        },
      },
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      visits: {
        include: { property: { select: { id: true, reference: true, titleFr: true } } },
        orderBy: { scheduledStart: "desc" },
      },
      activities: {
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
        orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      },
      stageHistory: {
        include: { changedBy: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/** Unlinked visits of the same prospect, offered in the "rattacher une visite" picker. */
export async function listLinkableVisits(prospectId: string, opportunityId: string) {
  return prisma.visit.findMany({
    where: { prospectId, OR: [{ opportunityId: null }, { opportunityId: { not: opportunityId } }] },
    select: {
      id: true,
      reference: true,
      scheduledStart: true,
      status: true,
      opportunityId: true,
      createdById: true,
      assignedToId: true,
      property: { select: { titleFr: true } },
    },
    orderBy: { scheduledStart: "desc" },
    take: 50,
  });
}

/**
 * ADMIN/SUPER_ADMIN only (caller checks canManageFinance): the commission
 * dossiers explicitly linked to this opportunity, with their planned agency
 * commission and the payments actually received (RECU/PARTIEL).
 */
export async function getOpportunityCommissions(opportunityId: string) {
  const cases = await prisma.commissionCase.findMany({
    where: { opportunityId },
    select: {
      id: true,
      reference: true,
      status: true,
      transaction: true,
      agencyCommissionAmount: true,
      currency: true,
      payments: { where: { status: { in: ["RECU", "PARTIEL"] } }, select: { amount: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = cases.map((commissionCase) => ({
    id: commissionCase.id,
    reference: commissionCase.reference,
    status: commissionCase.status,
    transaction: commissionCase.transaction,
    currency: commissionCase.currency,
    planned: Number(commissionCase.agencyCommissionAmount),
    collected: commissionCase.payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
  }));

  const active = rows.filter((row) => row.status !== "ANNULEE");
  return {
    cases: rows,
    commissionsPrevues: active.reduce((sum, row) => sum + row.planned, 0),
    commissionsEncaissees: rows.reduce((sum, row) => sum + row.collected, 0),
  };
}

/** ADMIN/SUPER_ADMIN only: commission dossiers on the same bien not yet linked to any opportunity. */
export async function listLinkableCommissionCases(propertyId: string) {
  return prisma.commissionCase.findMany({
    where: { propertyId, opportunityId: null },
    select: { id: true, reference: true, status: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Opportunities attached to a bien — the caller filters rows with canViewOpportunity. */
export async function listOpportunitiesForProperty(propertyId: string) {
  return prisma.opportunity.findMany({
    where: { propertyId },
    include: {
      prospect: { select: { id: true, reference: true, firstName: true, lastName: true, companyName: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/** Opportunities of a prospect — the caller filters rows with canViewOpportunity. */
export async function listOpportunitiesForProspect(prospectId: string) {
  return prisma.opportunity.findMany({
    where: { prospectId },
    include: {
      property: { select: { id: true, reference: true, titleFr: true, status: true, publicationStatus: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/** The open opportunity (if any) matching a visit's prospect + bien — used by the visit detail's "mettre à jour l'opportunité". */
export async function findOpenOpportunityForVisit(prospectId: string, propertyId: string) {
  return prisma.opportunity.findFirst({
    where: { prospectId, stage: { in: openOpportunityStages }, OR: [{ propertyId }, { propertyId: null }] },
    select: { id: true, reference: true, title: true, stage: true, propertyId: true, createdById: true, assignedToId: true },
    orderBy: [{ propertyId: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
  });
}

export async function getOpportunityPrefillFromVisit(visitId: string) {
  return prisma.visit.findUnique({
    where: { id: visitId },
    select: {
      id: true,
      reference: true,
      status: true,
      prospectId: true,
      propertyId: true,
      opportunityId: true,
      createdById: true,
      assignedToId: true,
      property: { select: { transaction: true, titleFr: true, price: true } },
    },
  });
}

export async function getPropertyPrefill(propertyId: string) {
  return prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, transaction: true, titleFr: true, price: true } });
}

/** Bounded picker, scoped to the prospects the current user can access. */
export async function searchProspectsForOpportunityPicker(role: Role, userId: string) {
  const where: Prisma.ProspectWhereInput = { status: { not: "ARCHIVE" } };
  const accessWhere = prospectAccessWhere(role, userId);
  if (accessWhere) Object.assign(where, accessWhere);
  return prisma.prospect.findMany({
    where,
    select: { id: true, reference: true, firstName: true, lastName: true, companyName: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
}

/** Bounded picker for the bien: non-archived biens first. */
export async function searchPropertiesForOpportunityPicker() {
  return prisma.property.findMany({
    where: { publicationStatus: { not: "ARCHIVE" } },
    select: { id: true, reference: true, titleFr: true, city: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
}

/** Filter sources for /admin/opportunites. Network lists are only loaded for SUPER_ADMIN/ADMIN. */
export async function getOpportunityFilterOptions(role: Role, userId: string, withNetwork: boolean) {
  const [cities, prospects, owners, promoters, intermediaries] = await Promise.all([
    prisma.property.findMany({
      where: { opportunities: { some: {} } },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
    prisma.prospect.findMany({
      where: { AND: [{ opportunities: { some: {} } }, prospectAccessWhere(role, userId) ?? {}] },
      select: { id: true, reference: true, firstName: true, lastName: true, companyName: true },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    withNetwork
      ? prisma.owner.findMany({ select: { id: true, fullNameOrCompany: true }, orderBy: { fullNameOrCompany: "asc" }, take: 300 })
      : Promise.resolve([]),
    withNetwork
      ? prisma.promoter.findMany({ select: { id: true, companyName: true }, orderBy: { companyName: "asc" }, take: 300 })
      : Promise.resolve([]),
    withNetwork
      ? prisma.intermediary.findMany({ select: { id: true, nameOrCompany: true }, orderBy: { nameOrCompany: "asc" }, take: 300 })
      : Promise.resolve([]),
  ]);
  return { cities: cities.map((row) => row.city), prospects, owners, promoters, intermediaries };
}

// --- Dashboard ----------------------------------------------------------------

function monthBounds(now: Date): { start: Date; end: Date } {
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
}

/**
 * Pipeline KPIs for the /admin dashboard, scoped like every other
 * operational block (opportunityOperationalWhere — AGENT/EDITOR/VIEWER only
 * ever see their own). Never includes any commission figure.
 */
export async function getPipelineSnapshot(role: Role, userId: string, scope: OperationalScope) {
  const now = new Date();
  const { start, end } = monthBounds(now);
  const inactivityLimit = new Date(now.getTime() - OPPORTUNITY_INACTIVITY_DAYS * 24 * 60 * 60 * 1000);
  const scopeWhere = opportunityOperationalWhere(role, userId, scope) ?? {};
  const open: Prisma.OpportunityWhereInput = { AND: [scopeWhere, { stage: { in: openOpportunityStages } }] };

  const [totals, closingThisMonthCount, closingThisMonth, dormantCount, dormant] = await Promise.all([
    computePipelineTotals(scopeWhere),
    prisma.opportunity.count({ where: { AND: [open, { expectedCloseDate: { gte: start, lt: end } }] } }),
    prisma.opportunity.findMany({
      where: { AND: [open, { expectedCloseDate: { gte: start, lt: end } }] },
      include: opportunityCardInclude,
      orderBy: { expectedCloseDate: "asc" },
      take: 8,
    }),
    prisma.opportunity.count({ where: { AND: [open, { lastActivityAt: { lt: inactivityLimit } }] } }),
    prisma.opportunity.findMany({
      where: { AND: [open, { lastActivityAt: { lt: inactivityLimit } }] },
      include: opportunityCardInclude,
      orderBy: { lastActivityAt: "asc" },
      take: 8,
    }),
  ]);

  return { ...totals, closingThisMonthCount, closingThisMonth, dormantCount, dormant };
}

/**
 * ADMIN/SUPER_ADMIN only (caller checks canManageFinance).
 * - commissionsPrevues = Σ CommissionCase.agencyCommissionAmount, cancelled (ANNULEE) dossiers excluded;
 * - commissionsEncaissees = Σ CommissionPayment.amount with status RECU/PARTIEL — the only figure
 *   that may be called "chiffre d'affaires encaissé".
 */
export async function getCommissionTotals() {
  const [prevues, encaissees] = await Promise.all([
    prisma.commissionCase.aggregate({ where: { status: { not: "ANNULEE" } }, _sum: { agencyCommissionAmount: true } }),
    prisma.commissionPayment.aggregate({ where: { status: { in: ["RECU", "PARTIEL"] } }, _sum: { amount: true } }),
  ]);
  return {
    commissionsPrevues: Number(prevues._sum.agencyCommissionAmount ?? 0),
    commissionsEncaissees: Number(encaissees._sum.amount ?? 0),
  };
}

/** Opportunity counters for an Owner/Promoter/Intermediary 360° (admin-only pages) — scoped through the linked biens. */
export async function getOpportunityStatsForProperties(propertyScope: Prisma.PropertyWhereInput) {
  const scoped: Prisma.OpportunityWhereInput = { property: propertyScope };
  const [totals, won, lost] = await Promise.all([
    computePipelineTotals(scoped),
    prisma.opportunity.count({ where: { ...scoped, stage: "GAGNEE" } }),
    prisma.opportunity.count({ where: { ...scoped, stage: "PERDUE" } }),
  ]);
  return { opportunitiesOpen: totals.openCount, opportunitiesWon: won, opportunitiesLost: lost, pipelineVolume: totals.pipelineVolume };
}

/** Prospect recap for the creation page — the caller checks canViewProspect. */
export async function getProspectPrefill(prospectId: string) {
  return prisma.prospect.findUnique({
    where: { id: prospectId },
    select: { id: true, reference: true, firstName: true, lastName: true, companyName: true, createdById: true, assignedToId: true },
  });
}
