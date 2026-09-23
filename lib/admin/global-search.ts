import "server-only";
import { prisma } from "@/lib/db";
import type { AuthenticatedUser } from "@/lib/auth/dal";
import { canManageFinance } from "@/lib/finance/permissions";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import { prospectAccessWhere } from "@/lib/crm/permissions";
import { prospectTypeLabels, type ProspectTypeValue } from "@/lib/crm/enum-labels";

export type GlobalSearchResultItem = { id: string; title: string; subtitle: string; href: string };

export type GlobalSearchResponse = {
  biens: GlobalSearchResultItem[];
  prospects: GlobalSearchResultItem[];
  proprietaires: GlobalSearchResultItem[];
  promoteurs: GlobalSearchResultItem[];
  intermediaires: GlobalSearchResultItem[];
  programmes: GlobalSearchResultItem[];
};

const RESULTS_PER_GROUP = 6;
const MIN_QUERY_LENGTH = 2;

/**
 * Contact fields are only ever readable in full by SUPER_ADMIN/ADMIN — every
 * other role that can see a result at all (e.g. an AGENT looking at their
 * own assigned prospect) gets a masked phone/e-mail, never the raw value.
 * Masking happens here, at the query layer, never left to the client.
 */
function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "••••";
  return `${phone.slice(0, 2)}••••${digits.slice(-2)}`;
}

function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.indexOf("@");
  if (at <= 0) return "••••";
  return `${email.slice(0, 1)}•••${email.slice(at)}`;
}

function contactLine(phone: string | null | undefined, email: string | null | undefined, canSeeFull: boolean): string {
  const p = canSeeFull ? phone : maskPhone(phone);
  const e = canSeeFull ? email : maskEmail(email);
  return [p, e].filter(Boolean).join(" · ") || "—";
}

/**
 * Global admin search (phase 6K). Called only from the API route below,
 * never rendered server-side into a page — the caller (a "use client"
 * command palette) fetches this on demand, so no result data is ever
 * present in the static/initial HTML.
 */
export async function runGlobalSearch(user: AuthenticatedUser, rawQuery: string): Promise<GlobalSearchResponse> {
  const q = rawQuery.trim();
  const empty: GlobalSearchResponse = { biens: [], prospects: [], proprietaires: [], promoteurs: [], intermediaires: [], programmes: [] };
  if (q.length < MIN_QUERY_LENGTH) return empty;

  const canSeeFullContact = canManageFinance(user.role); // SUPER_ADMIN/ADMIN — same roles as canViewPrivateData elsewhere.
  const canSeeNetwork = canManageRealEstateNetwork(user.role);
  const canSeeFinanceRefs = canManageFinance(user.role);

  const insensitive = { contains: q, mode: "insensitive" as const };

  const [properties, prospects, owners, promoters, intermediaries, programs] = await Promise.all([
    prisma.property.findMany({
      where: {
        OR: [
          { reference: insensitive },
          { titleFr: insensitive },
          { city: insensitive },
          { district: insensitive },
          { sourceExternalId: insensitive },
          ...(canSeeFinanceRefs
            ? [{ mandates: { some: { reference: insensitive } } }, { commissionCases: { some: { reference: insensitive } } }]
            : []),
        ],
      },
      select: { id: true, reference: true, titleFr: true, city: true },
      take: RESULTS_PER_GROUP,
      orderBy: { updatedAt: "desc" },
    }),

    prisma.prospect.findMany({
      where: {
        AND: [
          prospectAccessWhere(user.role, user.id) ?? {},
          {
            OR: [
              { firstName: insensitive },
              { lastName: insensitive },
              { companyName: insensitive },
              { phone: insensitive },
              { email: insensitive },
              { reference: insensitive },
            ],
          },
        ],
      },
      select: { id: true, reference: true, firstName: true, lastName: true, companyName: true, phone: true, email: true, type: true },
      take: RESULTS_PER_GROUP,
      orderBy: { createdAt: "desc" },
    }),

    canSeeNetwork
      ? prisma.owner.findMany({
          where: { OR: [{ fullNameOrCompany: insensitive }, { phone: insensitive }, { email: insensitive }, { cinOrIce: insensitive }] },
          select: { id: true, fullNameOrCompany: true, phone: true, email: true },
          take: RESULTS_PER_GROUP,
        })
      : Promise.resolve([]),

    canSeeNetwork
      ? prisma.promoter.findMany({
          where: { OR: [{ companyName: insensitive }, { phone: insensitive }, { email: insensitive }, { ice: insensitive }] },
          select: { id: true, companyName: true, phone: true, email: true },
          take: RESULTS_PER_GROUP,
        })
      : Promise.resolve([]),

    canSeeNetwork
      ? prisma.intermediary.findMany({
          where: { OR: [{ nameOrCompany: insensitive }, { phone: insensitive }, { email: insensitive }] },
          select: { id: true, nameOrCompany: true, phone: true, email: true },
          take: RESULTS_PER_GROUP,
        })
      : Promise.resolve([]),

    canSeeNetwork
      ? prisma.developmentProgram.findMany({
          where: { OR: [{ name: insensitive }, { city: insensitive }, { promoter: { companyName: insensitive } }] },
          select: { id: true, name: true, city: true, promoter: { select: { companyName: true } } },
          take: RESULTS_PER_GROUP,
        })
      : Promise.resolve([]),
  ]);

  return {
    biens: properties.map((p) => ({ id: p.id, title: p.titleFr, subtitle: `${p.reference} · ${p.city}`, href: `/admin/biens/${p.id}` })),
    prospects: prospects.map((p) => ({
      id: p.id,
      title: p.companyName || [p.firstName, p.lastName].filter(Boolean).join(" ") || p.reference,
      subtitle: `${prospectTypeLabels[p.type as ProspectTypeValue]} · ${contactLine(p.phone, p.email, canSeeFullContact)}`,
      href: `/admin/prospects/${p.id}`,
    })),
    proprietaires: owners.map((o) => ({
      id: o.id,
      title: o.fullNameOrCompany,
      subtitle: contactLine(o.phone, o.email, canSeeFullContact),
      href: `/admin/proprietaires/${o.id}`,
    })),
    promoteurs: promoters.map((p) => ({
      id: p.id,
      title: p.companyName,
      subtitle: contactLine(p.phone, p.email, canSeeFullContact),
      href: `/admin/promoteurs/${p.id}`,
    })),
    intermediaires: intermediaries.map((i) => ({
      id: i.id,
      title: i.nameOrCompany,
      subtitle: contactLine(i.phone, i.email, canSeeFullContact),
      href: `/admin/intermediaires/${i.id}`,
    })),
    programmes: programs.map((prog) => ({
      id: prog.id,
      title: prog.name,
      subtitle: `${prog.promoter.companyName} · ${prog.city}`,
      href: `/admin/programmes/${prog.id}`,
    })),
  };
}
