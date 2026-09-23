import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { canCreateOpportunity, canEditOpportunity, canReopenOpportunity } from "@/lib/crm/permissions";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import {
  listOpportunities,
  listOpportunitiesForBoard,
  getFilteredPipelineTotals,
  getOpportunityFilterOptions,
  type OpportunityListFilters,
} from "@/lib/crm/opportunity-queries";
import { listCrmAssignableUsers } from "@/lib/crm/prospect-queries";
import {
  opportunityStageOptions,
  opportunityStageLabels,
  opportunityTransactionOptions,
  opportunityTransactionLabels,
  propertyAvailabilityAlert,
  weightedAmount,
  isClosedStage,
  isOpportunityDormant,
  OPPORTUNITY_INACTIVITY_DAYS,
} from "@/lib/crm/opportunity-rules";
import { propertyTypeFromDb } from "@/lib/admin/property-enum-maps";
import { propertyTypeLabels } from "@/lib/property-schema";
import { madAmount } from "@/lib/admin/format";
import { roleLabels } from "@/lib/auth/roles";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import OpportunityKanban, { type KanbanCard } from "./_components/OpportunityKanban";

export const metadata: Metadata = {
  title: "Opportunités | NA Business Africa",
};

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function prospectLabel(prospect: { firstName: string | null; lastName: string | null; companyName: string | null; reference: string }): string {
  return prospect.companyName || [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || prospect.reference;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

const selectClass = "rounded-xl border border-anthracite-200 px-3 py-2 text-sm outline-none focus:border-gold-500";
const labelClass = "text-xs font-semibold uppercase tracking-wider text-anthracite-500";

export default async function OpportunitiesPage({ searchParams }: PageProps<"/admin/opportunites">) {
  const user = await requireAdminUser();
  const sp = await searchParams;
  const withNetwork = canManageRealEstateNetwork(user.role);

  const view = paramValue(sp.vue) === "tableau" ? "tableau" : "pipeline";
  const filters: OpportunityListFilters = {
    q: paramValue(sp.q),
    stage: paramValue(sp.stade),
    assignedToId: paramValue(sp.agent),
    transaction: paramValue(sp.transaction),
    city: paramValue(sp.ville),
    propertyType: paramValue(sp.type),
    closeFrom: paramValue(sp.cloture_du),
    closeTo: paramValue(sp.cloture_au),
    prospectId: paramValue(sp.prospect),
    ownerId: withNetwork ? paramValue(sp.proprietaire) : "",
    promoterId: withNetwork ? paramValue(sp.promoteur) : "",
    intermediaryId: withNetwork ? paramValue(sp.intermediaire) : "",
    page: Number(paramValue(sp.page)) || 1,
  };
  const filterParams: Record<string, string> = {
    q: filters.q ?? "",
    stade: filters.stage ?? "",
    agent: filters.assignedToId ?? "",
    transaction: filters.transaction ?? "",
    ville: filters.city ?? "",
    type: filters.propertyType ?? "",
    cloture_du: filters.closeFrom ?? "",
    cloture_au: filters.closeTo ?? "",
    prospect: filters.prospectId ?? "",
    proprietaire: filters.ownerId ?? "",
    promoteur: filters.promoterId ?? "",
    intermediaire: filters.intermediaryId ?? "",
  };
  const hasFilters = Object.values(filterParams).some(Boolean);

  function buildHref(overrides: Record<string, string>): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ vue: view, ...filterParams, ...overrides })) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    return query ? `/admin/opportunites?${query}` : "/admin/opportunites";
  }

  const [totals, users, options, board, table] = await Promise.all([
    getFilteredPipelineTotals(user.role, user.id, filters, withNetwork),
    listCrmAssignableUsers(),
    getOpportunityFilterOptions(user.role, user.id, withNetwork),
    view === "pipeline" ? listOpportunitiesForBoard(user.role, user.id, filters, withNetwork) : Promise.resolve(null),
    view === "tableau" ? listOpportunities(user.role, user.id, filters, withNetwork) : Promise.resolve(null),
  ]);

  const canReopen = canReopenOpportunity(user.role);

  const cards: KanbanCard[] = (board?.items ?? []).map((item) => ({
    id: item.id,
    reference: item.reference,
    title: item.title,
    stage: item.stage,
    prospectLabel: prospectLabel(item.prospect),
    propertyLabel: item.property ? `${item.property.titleFr} · ${item.property.city}` : null,
    propertyAlert: propertyAvailabilityAlert(item.property, item.stage),
    estimatedAmount: item.estimatedAmount === null ? null : Number(item.estimatedAmount),
    currency: item.currency,
    probability: item.probability,
    expectedCloseDate: item.expectedCloseDate ? item.expectedCloseDate.toISOString() : null,
    assignee: item.assignedTo ? (item.assignedTo.name ?? item.assignedTo.email) : null,
    canEdit: canEditOpportunity(user.role, user.id, item),
  }));

  const propertyTypeOptions = Object.entries(propertyTypeFromDb).map(([value, slug]) => ({ value, label: propertyTypeLabels[slug] }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Opportunités</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">Pipeline commercial</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {(["pipeline", "tableau"] as const).map((candidate) => (
              <Link
                key={candidate}
                href={buildHref({ vue: candidate, page: "" })}
                className={[
                  "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                  view === candidate ? "bg-anthracite-950 text-white" : "border border-anthracite-200 text-anthracite-600 hover:border-gold-400",
                ].join(" ")}
              >
                {candidate === "pipeline" ? "Pipeline" : "Tableau"}
              </Link>
            ))}
          </div>
          {canCreateOpportunity(user.role) && (
            <Button href="/admin/opportunites/nouveau" size="sm">
              + Nouvelle opportunité
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi label="Opportunités ouvertes" value={String(totals.openCount)} />
        <Kpi label="Volume pipeline" value={madAmount(totals.pipelineVolume)} hint="Σ montants estimés des opportunités ouvertes" />
        <Kpi label="Prévisionnel pondéré" value={madAmount(totals.weightedForecast)} hint="Σ montant estimé × probabilité (ouvertes)" />
      </div>

      <form method="get" className="flex flex-col gap-4 rounded-2xl border border-anthracite-100 bg-white p-6">
        <input type="hidden" name="vue" value={view} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className={labelClass}>Recherche</span>
            <input type="text" name="q" defaultValue={filters.q} placeholder="Référence, libellé, prospect, bien…" className={selectClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={labelClass}>Stade</span>
            <select name="stade" defaultValue={filters.stage} className={selectClass}>
              <option value="">Tous</option>
              <option value="OUVERTES">Toutes les ouvertes</option>
              {opportunityStageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={labelClass}>Agent</span>
            <select name="agent" defaultValue={filters.assignedToId} className={selectClass}>
              <option value="">Tous</option>
              {users.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name ?? candidate.email} ({roleLabels[candidate.role]})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={labelClass}>Transaction</span>
            <select name="transaction" defaultValue={filters.transaction} className={selectClass}>
              <option value="">Toutes</option>
              {opportunityTransactionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={labelClass}>Ville du bien</span>
            <select name="ville" defaultValue={filters.city} className={selectClass}>
              <option value="">Toutes</option>
              {options.cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={labelClass}>Type de bien</span>
            <select name="type" defaultValue={filters.propertyType} className={selectClass}>
              <option value="">Tous</option>
              {propertyTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={labelClass}>Prospect</span>
            <select name="prospect" defaultValue={filters.prospectId} className={selectClass}>
              <option value="">Tous</option>
              {options.prospects.map((prospect) => (
                <option key={prospect.id} value={prospect.id}>
                  {prospectLabel(prospect)} ({prospect.reference})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={labelClass}>Clôture du</span>
            <input type="date" name="cloture_du" defaultValue={filters.closeFrom} className={selectClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={labelClass}>Clôture au</span>
            <input type="date" name="cloture_au" defaultValue={filters.closeTo} className={selectClass} />
          </label>
          {withNetwork && (
            <>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className={labelClass}>Propriétaire</span>
                <select name="proprietaire" defaultValue={filters.ownerId} className={selectClass}>
                  <option value="">Tous</option>
                  {options.owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.fullNameOrCompany}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className={labelClass}>Promoteur</span>
                <select name="promoteur" defaultValue={filters.promoterId} className={selectClass}>
                  <option value="">Tous</option>
                  {options.promoters.map((promoter) => (
                    <option key={promoter.id} value={promoter.id}>
                      {promoter.companyName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className={labelClass}>Intermédiaire</span>
                <select name="intermediaire" defaultValue={filters.intermediaryId} className={selectClass}>
                  <option value="">Tous</option>
                  {options.intermediaries.map((intermediary) => (
                    <option key={intermediary.id} value={intermediary.id}>
                      {intermediary.nameOrCompany}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="w-fit rounded-full bg-anthracite-950 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-anthracite-800">
            Filtrer
          </button>
          {hasFilters && (
            <Link href={`/admin/opportunites?vue=${view}`} className="text-sm text-anthracite-500 hover:text-gold-600">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {view === "pipeline" && board && (
        <>
          {board.truncated && (
            <p className="rounded-xl bg-gold-200/30 px-4 py-3 text-sm text-anthracite-700">
              {board.items.length} opportunités affichées sur {board.total} — affinez les filtres ou utilisez la vue tableau.
            </p>
          )}
          <OpportunityKanban cards={cards} canReopen={canReopen} />
        </>
      )}

      {view === "tableau" && table && (
        <>
          {table.items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-anthracite-200 bg-white p-16 text-center">
              <p className="font-display text-lg text-anthracite-900">
                {hasFilters ? "Aucune opportunité ne correspond à ces critères." : "Aucune opportunité enregistrée pour le moment."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-anthracite-100 bg-white">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className="border-b border-anthracite-100 text-xs font-semibold uppercase tracking-wider text-anthracite-400">
                    <th className="px-4 py-3">Référence</th>
                    <th className="px-4 py-3">Libellé</th>
                    <th className="px-4 py-3">Prospect</th>
                    <th className="px-4 py-3">Bien</th>
                    <th className="px-4 py-3">Transaction</th>
                    <th className="px-4 py-3">Stade</th>
                    <th className="px-4 py-3 text-right">Montant estimé</th>
                    <th className="px-4 py-3 text-right">Proba.</th>
                    <th className="px-4 py-3 text-right">Pondéré</th>
                    <th className="px-4 py-3">Clôture</th>
                    <th className="px-4 py-3">Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {table.items.map((item) => {
                    const amount = item.estimatedAmount === null ? null : Number(item.estimatedAmount);
                    const alert = propertyAvailabilityAlert(item.property, item.stage);
                    const dormant = isOpportunityDormant(item.lastActivityAt, item.stage);
                    return (
                      <tr key={item.id} className="border-b border-anthracite-50 last:border-0">
                        <td className="px-4 py-3 font-medium">
                          <Link href={`/admin/opportunites/${item.id}`} className="text-gold-600 hover:text-gold-500">
                            {item.reference}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-anthracite-900">
                          {item.title}
                          {dormant && <span className="block text-xs text-amber-700">Sans activité depuis {OPPORTUNITY_INACTIVITY_DAYS} j+</span>}
                        </td>
                        <td className="px-4 py-3 text-anthracite-600">{prospectLabel(item.prospect)}</td>
                        <td className="px-4 py-3 text-anthracite-600">
                          {item.property ? item.property.titleFr : "—"}
                          {alert && <span className="block text-xs font-medium text-red-600">{alert}</span>}
                        </td>
                        <td className="px-4 py-3 text-anthracite-600">{opportunityTransactionLabels[item.transaction]}</td>
                        <td className="px-4 py-3">
                          <Badge tone={isClosedStage(item.stage) ? "anthracite" : "outline"}>{opportunityStageLabels[item.stage]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-anthracite-600">{madAmount(amount)}</td>
                        <td className="px-4 py-3 text-right text-anthracite-600">{item.probability} %</td>
                        <td className="px-4 py-3 text-right text-anthracite-600">{madAmount(weightedAmount(amount, item.probability))}</td>
                        <td className="px-4 py-3 text-anthracite-600">
                          {item.closedAt
                            ? dateFormatter.format(item.closedAt)
                            : item.expectedCloseDate
                              ? dateFormatter.format(item.expectedCloseDate)
                              : "—"}
                        </td>
                        <td className="px-4 py-3 text-anthracite-600">{item.assignedTo?.name ?? item.assignedTo?.email ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {table.pageCount > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: table.pageCount }, (_, index) => index + 1).map((pageNumber) => (
                <Link
                  key={pageNumber}
                  href={buildHref({ page: String(pageNumber) })}
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
                    pageNumber === table.page ? "bg-anthracite-900 text-white" : "border border-anthracite-200 text-anthracite-600 hover:border-gold-400",
                  ].join(" ")}
                >
                  {pageNumber}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-anthracite-100 bg-white p-5">
      <span className="text-sm text-anthracite-500">{label}</span>
      <span className="font-display text-2xl font-semibold text-anthracite-950">{value}</span>
      {hint && <span className="text-[11px] text-anthracite-400">{hint}</span>}
    </div>
  );
}
