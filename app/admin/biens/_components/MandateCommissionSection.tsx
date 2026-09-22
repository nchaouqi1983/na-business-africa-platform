import Link from "next/link";
import { mandateTypeLabels, mandateStatusLabels, commissionCaseStatusLabels } from "@/lib/finance/enum-labels";
import { madAmount } from "@/lib/admin/format";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import MandateQuickCreatePanel from "./MandateQuickCreatePanel";

export type PropertyMandateDto = {
  id: string;
  reference: string;
  type: string;
  status: string;
  owner: { id: string; fullNameOrCompany: string } | null;
  commissionCases: { id: string; reference: string; status: string }[];
};

export type PropertyCommissionCaseDto = {
  id: string;
  reference: string;
  status: string;
  transaction: string;
  agencyCommissionAmount: number;
  currency: string;
};

type Props = {
  propertyId: string;
  mandates: PropertyMandateDto[];
  commissionCases: PropertyCommissionCaseDto[];
  pickerOwners: { id: string; label: string }[];
};

/**
 * Internal-only "Mandat & commissions" section for a bien's dossier
 * (phase 6F) — rendered exclusively for SUPER_ADMIN/ADMIN (see
 * canManageFinance), never for AGENT/EDITOR/VIEWER and never surfaced on
 * the public site.
 */
export default function MandateCommissionSection({ propertyId, mandates, commissionCases, pickerOwners }: Props) {
  return (
    <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
      <h2 className="font-display text-lg font-semibold text-anthracite-950">Mandat &amp; commissions (interne)</h2>
      <p className="mt-1 text-sm text-anthracite-500">
        Mandats et dossiers de commission liés à ce bien — jamais visible sur le site public.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Mandats ({mandates.length})</h3>
          {mandates.length === 0 ? (
            <p className="text-sm text-anthracite-400">Aucun mandat pour ce bien.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {mandates.map((mandate) => (
                <li key={mandate.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-anthracite-100 p-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-anthracite-900">{mandate.reference}</span>
                    <span className="text-xs text-anthracite-400">
                      {mandateTypeLabels[mandate.type as keyof typeof mandateTypeLabels]}
                      {mandate.owner ? ` · ${mandate.owner.fullNameOrCompany}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={mandate.status === "ACTIF" ? "gold" : "outline"}>
                      {mandateStatusLabels[mandate.status as keyof typeof mandateStatusLabels]}
                    </Badge>
                    <Link href={`/admin/mandats/${mandate.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-500">
                      Voir
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <MandateQuickCreatePanel propertyId={propertyId} pickerOwners={pickerOwners} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">
              Dossiers de commission ({commissionCases.length})
            </h3>
            <Button href={`/admin/commissions/nouveau?propertyId=${propertyId}`} variant="secondary" size="sm">
              + Nouveau dossier
            </Button>
          </div>
          {commissionCases.length === 0 ? (
            <p className="text-sm text-anthracite-400">Aucun dossier de commission pour ce bien.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {commissionCases.map((commissionCase) => (
                <li
                  key={commissionCase.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-anthracite-100 p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-anthracite-900">{commissionCase.reference}</span>
                    <span className="text-xs text-anthracite-400">
                      {madAmount(commissionCase.agencyCommissionAmount)} {commissionCase.currency}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={commissionCase.status === "PAYEE" ? "gold" : "outline"}>
                      {commissionCaseStatusLabels[commissionCase.status as keyof typeof commissionCaseStatusLabels]}
                    </Badge>
                    <Link href={`/admin/commissions/${commissionCase.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-500">
                      Voir
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
