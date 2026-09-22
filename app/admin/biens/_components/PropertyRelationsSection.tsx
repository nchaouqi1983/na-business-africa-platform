import OwnerLinksManager, { type OwnerPickerOption, type PropertyOwnerLinkDto, type LegacyOwnerInfo } from "./OwnerLinksManager";
import IntermediaryLinksManager, {
  type IntermediaryPickerOption,
  type PropertyIntermediaryLinkDto,
} from "./IntermediaryLinksManager";
import DevelopmentLinkManager, { type ProgramPickerOption, type PromoterPickerOption } from "./DevelopmentLinkManager";

type Props = {
  propertyId: string;
  ownerLinks: PropertyOwnerLinkDto[];
  pickerOwners: OwnerPickerOption[];
  intermediaryLinks: PropertyIntermediaryLinkDto[];
  pickerIntermediaries: IntermediaryPickerOption[];
  currentProgramId: string | null;
  currentLotId: string | null;
  pickerPrograms: ProgramPickerOption[];
  pickerPromoters: PromoterPickerOption[];
  legacyOwnerInfo?: LegacyOwnerInfo | null;
};

/**
 * Internal-only "Relations" section for a bien's dossier (phase 6E) —
 * owners, promoter/program/lot and intermediaries. Rendered exclusively for
 * SUPER_ADMIN/ADMIN (see canManageRealEstateNetwork), never for
 * AGENT/EDITOR/VIEWER and never surfaced on the public site.
 */
export default function PropertyRelationsSection({
  propertyId,
  ownerLinks,
  pickerOwners,
  intermediaryLinks,
  pickerIntermediaries,
  currentProgramId,
  currentLotId,
  pickerPrograms,
  pickerPromoters,
  legacyOwnerInfo,
}: Props) {
  return (
    <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
      <h2 className="font-display text-lg font-semibold text-anthracite-950">Relations (interne)</h2>
      <p className="mt-1 text-sm text-anthracite-500">
        Propriétaires, promoteur/programme/lot et intermédiaires rattachés à ce bien — jamais visible sur le site public.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <OwnerLinksManager propertyId={propertyId} initialLinks={ownerLinks} pickerOwners={pickerOwners} legacyOwnerInfo={legacyOwnerInfo} />
        <DevelopmentLinkManager
          propertyId={propertyId}
          currentProgramId={currentProgramId}
          currentLotId={currentLotId}
          initialPrograms={pickerPrograms}
          initialPromoters={pickerPromoters}
        />
        <IntermediaryLinksManager propertyId={propertyId} initialLinks={intermediaryLinks} pickerIntermediaries={pickerIntermediaries} />
      </div>
    </div>
  );
}
