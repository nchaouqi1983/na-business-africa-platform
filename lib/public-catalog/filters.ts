import {
  defaultFilterState,
  propertyTypeLabels,
  propertyTypeValues,
  transactionValues,
  conditionValues,
  furnishedValues,
  sortOptionValues,
  type PropertyFilterState,
  type PropertyType,
} from "@/lib/property-schema";

/**
 * Explorer's filter UI serializes/parses its state straight to and from the
 * URL — every PropertyFilterState field name IS the query param name — so
 * the server page and the client filter bar share one shape with no
 * translation layer. A handful of legacy param names (`ville`, `type` as a
 * French label, `budget` as "min-max") are also accepted, so links from the
 * homepage, /acheter and /villes keep working unchanged.
 */

export const EXPLORER_PAGE_SIZE = 24;

type SearchParamsLike = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function resolveTypeParam(raw: string): PropertyType | "" {
  if (!raw) return "";
  if ((propertyTypeValues as readonly string[]).includes(raw)) return raw as PropertyType;
  const entry = (Object.entries(propertyTypeLabels) as [PropertyType, string][]).find(([, label]) => label === raw);
  return entry ? entry[0] : "";
}

function bool(raw: string): boolean {
  return raw === "1" || raw === "true";
}

export function parseFilterStateFromSearchParams(searchParams: SearchParamsLike): PropertyFilterState {
  const sp = (key: string) => first(searchParams[key]);

  const budget = sp("budget");
  const [budgetMinLegacy, budgetMaxLegacy] = budget ? budget.split("-") : ["", ""];

  const tagsRaw = searchParams.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw
    : typeof tagsRaw === "string" && tagsRaw.length > 0
      ? tagsRaw.split(",")
      : [];

  const transaction = sp("transaction");
  const condition = sp("condition");
  const furnished = sp("furnished");
  const sort = sp("sort");

  return {
    ...defaultFilterState,
    keyword: sp("keyword"),
    transaction: (transactionValues as readonly string[]).includes(transaction) ? (transaction as PropertyFilterState["transaction"]) : "",
    type: resolveTypeParam(sp("type")),
    subType: sp("subType"),
    city: sp("city") || sp("ville"),
    district: sp("district"),
    budgetMin: sp("budgetMin") || budgetMinLegacy || "",
    budgetMax: sp("budgetMax") || budgetMaxLegacy || "",
    pricePerSqmMax: sp("pricePerSqmMax"),
    surfaceMin: sp("surfaceMin"),
    surfaceMax: sp("surfaceMax"),
    bedroomsMin: sp("bedroomsMin"),
    bathroomsMin: sp("bathroomsMin"),
    parkingMin: sp("parkingMin"),
    floor: sp("floor"),
    condition: (conditionValues as readonly string[]).includes(condition) ? (condition as PropertyFilterState["condition"]) : "",
    furnished: (furnishedValues as readonly string[]).includes(furnished) ? (furnished as PropertyFilterState["furnished"]) : "",
    exclusiveOnly: bool(sp("exclusiveOnly")),
    newOnly: bool(sp("newOnly")),
    offMarketOnly: bool(sp("offMarketOnly")),
    priceOnRequestOnly: bool(sp("priceOnRequestOnly")),
    coupDeCoeurOnly: bool(sp("coupDeCoeurOnly")),
    bonneAffaireOnly: bool(sp("bonneAffaireOnly")),
    tags,
    legalTitled: bool(sp("legalTitled")),
    airbnbAllowed: bool(sp("airbnbAllowed")),
    creditEligible: bool(sp("creditEligible")),
    mourabahaEligible: bool(sp("mourabahaEligible")),
    minYield: sp("minYield"),
    sort: (sortOptionValues as readonly string[]).includes(sort) ? (sort as PropertyFilterState["sort"]) : "pertinence",
  };
}

export function getExplorerPage(searchParams: SearchParamsLike): number {
  const raw = Number(first(searchParams.page));
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
}

/** Serializes filter state back to a query string — used by the client filter bar to push URL updates. Omits fields left at their default value, so links stay short. */
export function serializeFilterState(state: PropertyFilterState): string {
  const params = new URLSearchParams();
  const set = (key: string, value: string) => {
    if (value) params.set(key, value);
  };
  const setBool = (key: string, value: boolean) => {
    if (value) params.set(key, "1");
  };

  set("keyword", state.keyword);
  set("transaction", state.transaction);
  set("type", state.type);
  set("subType", state.subType);
  set("city", state.city);
  set("district", state.district);
  set("budgetMin", state.budgetMin);
  set("budgetMax", state.budgetMax);
  set("pricePerSqmMax", state.pricePerSqmMax);
  set("surfaceMin", state.surfaceMin);
  set("surfaceMax", state.surfaceMax);
  set("bedroomsMin", state.bedroomsMin);
  set("bathroomsMin", state.bathroomsMin);
  set("parkingMin", state.parkingMin);
  set("floor", state.floor);
  set("condition", state.condition);
  set("furnished", state.furnished);
  setBool("exclusiveOnly", state.exclusiveOnly);
  setBool("newOnly", state.newOnly);
  setBool("offMarketOnly", state.offMarketOnly);
  setBool("priceOnRequestOnly", state.priceOnRequestOnly);
  setBool("coupDeCoeurOnly", state.coupDeCoeurOnly);
  setBool("bonneAffaireOnly", state.bonneAffaireOnly);
  if (state.tags.length > 0) params.set("tags", state.tags.join(","));
  setBool("legalTitled", state.legalTitled);
  setBool("airbnbAllowed", state.airbnbAllowed);
  setBool("creditEligible", state.creditEligible);
  setBool("mourabahaEligible", state.mourabahaEligible);
  set("minYield", state.minYield);
  if (state.sort !== "pertinence") params.set("sort", state.sort);

  return params.toString();
}
