import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/dal";
import { getPropertyById, getPropertyPrivateById, listAssignableUsers } from "@/lib/admin/property-queries";
import { listPropertyMedia } from "@/lib/admin/property-media-queries";
import { toPropertyMediaDto } from "@/lib/admin/property-media-dto";
import { listPropertyDocuments } from "@/lib/admin/property-document-queries";
import { toPropertyDocumentDto } from "@/lib/admin/property-document-dto";
import { listPropertyExternalLinks } from "@/lib/admin/property-external-link-queries";
import { toPropertyExternalLinkDto } from "@/lib/admin/property-external-link-dto";
import { listActiveTags } from "@/lib/admin/property-tags";
import {
  canEditProperty,
  canPublishProperty,
  canArchiveProperty,
  canViewPrivateData,
  canViewRestrictedDocuments,
  canManageTags,
} from "@/lib/property-permissions";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import { listPropertyOwnerLinks, listPropertyIntermediaryLinks, getPropertyDevelopmentLink } from "@/lib/real-estate-network/property-links-queries";
import { searchActiveOwners } from "@/lib/real-estate-network/owner-queries";
import { searchActiveIntermediaries } from "@/lib/real-estate-network/intermediary-queries";
import { listActiveProgramsWithLotsForPicker } from "@/lib/real-estate-network/program-queries";
import { searchActivePromoters } from "@/lib/real-estate-network/promoter-queries";
import { canManageFinance } from "@/lib/finance/permissions";
import { listMandatesForProperty } from "@/lib/finance/mandate-queries";
import { listCommissionCasesForProperty } from "@/lib/finance/commission-queries";
import { canViewProspect, canViewVisit, canViewOpportunity, canCreateOpportunity } from "@/lib/crm/permissions";
import { listOpportunitiesForProperty } from "@/lib/crm/opportunity-queries";
import { opportunityStageLabels, propertyAvailabilityAlert, isClosedStage } from "@/lib/crm/opportunity-rules";
import { listInterestsForProperty } from "@/lib/crm/prospect-queries";
import { listVisitsForProperty } from "@/lib/crm/visit-queries";
import { interestLevelLabels, visitStatusLabels } from "@/lib/crm/enum-labels";
import PropertyRelationsSection from "../_components/PropertyRelationsSection";
import MandateCommissionSection from "../_components/MandateCommissionSection";
import {
  archiveProperty,
  publishProperty,
  unpublishProperty,
  updatePropertyDossier,
  savePropertyPrivateData,
} from "@/lib/admin/property-actions";
import {
  transactionFromDb,
  propertyTypeFromDb,
  propertyStatusFromDb,
  propertyStatusLabels,
  publicationStatusLabels,
  visibilityLabels,
  conditionFromDb,
  furnishedFromDb,
  orientationFromDb,
} from "@/lib/admin/property-enum-maps";
import { transactionLabels, propertyTypeLabels, propertyTypeGroup } from "@/lib/property-schema";
import { parseStoredDetails } from "@/lib/admin/property-details-schema";
import { formatDateTime, formatPrice } from "@/lib/admin/format";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import PropertyDossierForm from "../_components/PropertyDossierForm";
import PropertyPrivateForm from "../_components/PropertyPrivateForm";

export const metadata: Metadata = {
  title: "Bien | NA Business Africa",
};

const errorMessages: Record<string, string> = {
  permission: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
  publication:
    "Ce bien doit avoir un prix, ou être marqué « prix sur demande », pour pouvoir être publié.",
};

export default async function PropertyDetailPage({
  params,
  searchParams,
}: PageProps<"/admin/biens/[id]">) {
  const user = await requireAdminUser();
  const { id } = await params;
  const sp = await searchParams;

  const property = await getPropertyById(id);
  if (!property) notFound();

  const errorParam = typeof sp.erreur === "string" ? sp.erreur : undefined;
  const errorMessage = errorParam ? errorMessages[errorParam] : undefined;

  const canEdit = canEditProperty(user.role, user.id, property);
  const canPublish = canPublishProperty(user.role);
  const canArchive = canArchiveProperty(user.role);
  const canSeePrivate = canViewPrivateData(user.role);
  const canSeeRestrictedDocuments = canViewRestrictedDocuments(user.role);
  const canAssign = canManageTags(user.role);
  const canManageNetwork = canManageRealEstateNetwork(user.role);
  const canManageFinanceModule = canManageFinance(user.role);

  const [
    allTags,
    assignableUsers,
    privateData,
    media,
    documents,
    links,
    ownerLinks,
    intermediaryLinks,
    developmentLink,
    pickerOwners,
    pickerIntermediaries,
    pickerPrograms,
    pickerPromoters,
    propertyMandates,
    propertyCommissionCases,
    propertyInterests,
    propertyVisits,
    propertyOpportunities,
  ] = await Promise.all([
    listActiveTags(),
    canAssign ? listAssignableUsers() : Promise.resolve([]),
    canSeePrivate ? getPropertyPrivateById(id) : Promise.resolve(null),
    canEdit ? listPropertyMedia(id) : Promise.resolve([]),
    canEdit ? listPropertyDocuments(id, canSeeRestrictedDocuments) : Promise.resolve([]),
    canEdit ? listPropertyExternalLinks(id) : Promise.resolve([]),
    canManageNetwork ? listPropertyOwnerLinks(id) : Promise.resolve([]),
    canManageNetwork ? listPropertyIntermediaryLinks(id) : Promise.resolve([]),
    canManageNetwork ? getPropertyDevelopmentLink(id) : Promise.resolve(null),
    canManageNetwork || canManageFinanceModule ? searchActiveOwners() : Promise.resolve([]),
    canManageNetwork ? searchActiveIntermediaries() : Promise.resolve([]),
    canManageNetwork ? listActiveProgramsWithLotsForPicker() : Promise.resolve([]),
    canManageNetwork ? searchActivePromoters() : Promise.resolve([]),
    canManageFinanceModule ? listMandatesForProperty(id) : Promise.resolve([]),
    canManageFinanceModule ? listCommissionCasesForProperty(id) : Promise.resolve([]),
    listInterestsForProperty(id),
    listVisitsForProperty(id),
    listOpportunitiesForProperty(id),
  ]);

  // Row-level CRM filtering: this bien dossier is shared across roles, but a
  // prospect/visit only shows here when the viewing user can otherwise see
  // it (see lib/crm/permissions.ts) — never leak another agent's prospect.
  const visibleInterests = propertyInterests.filter((interest) => canViewProspect(user.role, user.id, interest.prospect));
  const visibleVisits = propertyVisits.filter((visit) => canViewVisit(user.role, user.id, visit) && canViewProspect(user.role, user.id, visit.prospect));
  const visibleOpportunities = propertyOpportunities.filter((opportunity) => canViewOpportunity(user.role, user.id, opportunity));

  const boundUpdate = updatePropertyDossier.bind(null, property.id);
  const boundPrivate = savePropertyPrivateData.bind(null, property.id);
  const boundPublish = publishProperty.bind(null, property.id);
  const boundUnpublish = unpublishProperty.bind(null, property.id);
  const boundArchive = archiveProperty.bind(null, property.id);

  const isArchived = property.publicationStatus === "ARCHIVE";
  const group = propertyTypeGroup[propertyTypeFromDb[property.propertyType]];

  return (
    <div className="flex flex-col gap-8">
      {errorMessage && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
            {property.reference}
          </span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">{property.titleFr}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="outline">{publicationStatusLabels[property.publicationStatus]}</Badge>
            <Badge tone="outline">{visibilityLabels[property.visibility]}</Badge>
            <Badge tone="outline">{propertyStatusLabels[propertyStatusFromDb[property.status]]}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {!isArchived && property.publicationStatus === "BROUILLON" && canPublish && (
            <form action={boundPublish}>
              <Button type="submit" size="sm">
                Publier
              </Button>
            </form>
          )}
          {!isArchived && property.publicationStatus === "PUBLIE" && canPublish && (
            <form action={boundUnpublish}>
              <Button type="submit" variant="secondary" size="sm">
                Dépublier
              </Button>
            </form>
          )}
          {!isArchived && canArchive && (
            <form action={boundArchive}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="border border-anthracite-200 hover:border-gold-500"
              >
                Archiver
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-anthracite-100 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Transaction" value={transactionLabels[transactionFromDb[property.transaction]]} />
        <Info label="Type" value={propertyTypeLabels[propertyTypeFromDb[property.propertyType]]} />
        <Info label="Ville" value={property.district ? `${property.city} — ${property.district}` : property.city} />
        <Info label="Prix" value={formatPrice(property.price, property.priceOnRequest)} />
        <Info label="Créé par" value={property.createdBy.name ?? property.createdBy.email} />
        <Info label="Créé le" value={formatDateTime(property.createdAt)} />
        <Info
          label="Dernière modification"
          value={
            property.updatedBy
              ? `${formatDateTime(property.updatedAt)} — ${property.updatedBy.name ?? property.updatedBy.email}`
              : formatDateTime(property.updatedAt)
          }
        />
        <Info
          label="Assigné à"
          value={property.assignedTo ? (property.assignedTo.name ?? property.assignedTo.email) : "—"}
        />
      </div>

      {canEdit ? (
        <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
          <h2 className="font-display text-lg font-semibold text-anthracite-950">Dossier du bien</h2>
          <div className="mt-6">
            <PropertyDossierForm
              action={boundUpdate}
              submitLabel="Enregistrer les modifications"
              allTags={allTags}
              canCreateTag={canAssign}
              canAssign={canAssign}
              assignableUsers={assignableUsers}
              propertyId={property.id}
              initialMedia={media.map(toPropertyMediaDto)}
              canUploadMedia={canEdit}
              initialDocuments={documents.map(toPropertyDocumentDto)}
              initialLinks={links.map(toPropertyExternalLinkDto)}
              canManageDocuments={canEdit}
              canManageRestrictedDocuments={canSeeRestrictedDocuments}
              defaultValues={{
                titleFr: property.titleFr,
                shortDescription: property.shortDescription ?? undefined,
                descriptionFr: property.descriptionFr ?? undefined,
                transaction: transactionFromDb[property.transaction],
                propertyType: propertyTypeFromDb[property.propertyType],
                propertySubtype: property.propertySubtype ?? undefined,
                status: propertyStatusFromDb[property.status],
                visibility: property.visibility,
                isFeatured: property.isFeatured,
                isGoodDeal: property.isGoodDeal,
                isCoupDeCoeur: property.isCoupDeCoeur,
                assignedToId: property.assignedToId ?? undefined,

                city: property.city,
                district: property.district ?? undefined,
                addressPublic: property.addressPublic ?? undefined,
                latitude: property.latitude ?? undefined,
                longitude: property.longitude ?? undefined,
                proximityNotes: property.proximityNotes ?? undefined,

                price: property.price ? Number(property.price) : undefined,
                priceOnRequest: property.priceOnRequest,
                pricePerSqm: property.pricePerSqm ? Number(property.pricePerSqm) : undefined,
                negotiable: property.negotiable,
                agencyFeePercent: property.agencyFeePercent ? Number(property.agencyFeePercent) : undefined,
                monthlyCharges: property.monthlyCharges ? Number(property.monthlyCharges) : undefined,
                securityDeposit: property.securityDeposit ? Number(property.securityDeposit) : undefined,
                estimatedYieldPercent: property.estimatedYieldPercent
                  ? Number(property.estimatedYieldPercent)
                  : undefined,
                isCreditEligible: property.isCreditEligible,
                isMourabahaEligible: property.isMourabahaEligible,

                livingArea: property.livingArea ?? undefined,
                builtArea: property.builtArea ?? undefined,
                landArea: property.landArea ?? undefined,
                terraceArea: property.terraceArea ?? undefined,
                balconyArea: property.balconyArea ?? undefined,
                basementArea: property.basementArea ?? undefined,
                bedrooms: property.bedrooms ?? undefined,
                suites: property.suites ?? undefined,
                bathrooms: property.bathrooms ?? undefined,
                salons: property.salons ?? undefined,
                kitchens: property.kitchens ?? undefined,
                parkingSpaces: property.parkingSpaces ?? undefined,
                floor: property.floor ?? undefined,
                totalFloors: property.totalFloors ?? undefined,
                yearBuilt: property.yearBuilt ?? undefined,
                condition: property.condition ? conditionFromDb[property.condition] : undefined,
                furnished: property.furnished ? furnishedFromDb[property.furnished] : undefined,
                orientation: property.orientation ? orientationFromDb[property.orientation] : undefined,

                details: parseStoredDetails(property.details, group),
                tagSlugs: property.tags.map((tag) => tag.slug),
              }}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-anthracite-400">Votre rôle ne permet pas de modifier ce bien.</p>
      )}

      {canSeePrivate && (
        <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
          <h2 className="font-display text-lg font-semibold text-anthracite-950">Données privées / internes</h2>
          <div className="mt-6">
            <PropertyPrivateForm
              action={boundPrivate}
              defaultValues={
                privateData
                  ? {
                      privateAddress: privateData.privateAddress ?? undefined,
                      ownerName: privateData.ownerName ?? undefined,
                      ownerPhone: privateData.ownerPhone ?? undefined,
                      ownerEmail: privateData.ownerEmail ?? undefined,
                      mandateReference: privateData.mandateReference ?? undefined,
                      mandateStartDate: privateData.mandateStartDate
                        ? privateData.mandateStartDate.toISOString().slice(0, 10)
                        : undefined,
                      mandateEndDate: privateData.mandateEndDate
                        ? privateData.mandateEndDate.toISOString().slice(0, 10)
                        : undefined,
                      minimumNetPrice: privateData.minimumNetPrice ? Number(privateData.minimumNetPrice) : undefined,
                      internalNotes: privateData.internalNotes ?? undefined,
                      source: privateData.source ?? undefined,
                    }
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {canManageNetwork ? (
        <PropertyRelationsSection
          propertyId={property.id}
          ownerLinks={ownerLinks.map((link) => ({
            id: link.id,
            ownerId: link.ownerId,
            role: link.role,
            quoteShare: link.quoteShare ? Number(link.quoteShare) : null,
            isMainContact: link.isMainContact,
            owner: {
              id: link.owner.id,
              fullNameOrCompany: link.owner.fullNameOrCompany,
              kind: link.owner.kind,
              city: link.owner.city,
            },
          }))}
          pickerOwners={pickerOwners.map((owner) => ({
            id: owner.id,
            fullNameOrCompany: owner.fullNameOrCompany,
            kind: owner.kind,
            city: owner.city,
          }))}
          intermediaryLinks={intermediaryLinks.map((link) => ({
            id: link.id,
            intermediaryId: link.intermediaryId,
            role: link.role,
            note: link.note,
            intermediary: {
              id: link.intermediary.id,
              nameOrCompany: link.intermediary.nameOrCompany,
              type: link.intermediary.type,
              city: link.intermediary.city,
            },
          }))}
          pickerIntermediaries={pickerIntermediaries.map((item) => ({
            id: item.id,
            nameOrCompany: item.nameOrCompany,
            type: item.type,
            city: item.city,
          }))}
          currentProgramId={developmentLink?.developmentProgramId ?? null}
          currentLotId={developmentLink?.developmentLotId ?? null}
          pickerPrograms={pickerPrograms.map((program) => ({
            id: program.id,
            name: program.name,
            promoter: { id: program.promoter.id, companyName: program.promoter.companyName },
            lots: program.lots,
          }))}
          pickerPromoters={pickerPromoters.map((promoter) => ({ id: promoter.id, companyName: promoter.companyName }))}
          legacyOwnerInfo={
            privateData
              ? { ownerName: privateData.ownerName, ownerPhone: privateData.ownerPhone, ownerEmail: privateData.ownerEmail }
              : null
          }
        />
      ) : (
        <p className="text-sm text-anthracite-400">Votre rôle ne permet pas d&apos;accéder aux relations internes de ce bien.</p>
      )}

      {canManageFinanceModule && (
        <MandateCommissionSection
          propertyId={property.id}
          mandates={propertyMandates.map((mandate) => ({
            id: mandate.id,
            reference: mandate.reference,
            type: mandate.type,
            status: mandate.status,
            owner: mandate.owner,
            commissionCases: mandate.commissionCases,
          }))}
          commissionCases={propertyCommissionCases.map((commissionCase) => ({
            id: commissionCase.id,
            reference: commissionCase.reference,
            status: commissionCase.status,
            transaction: commissionCase.transaction,
            agencyCommissionAmount: Number(commissionCase.agencyCommissionAmount),
            currency: commissionCase.currency,
          }))}
          pickerOwners={pickerOwners.map((owner) => ({ id: owner.id, label: owner.fullNameOrCompany }))}
        />
      )}

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">
          Prospects intéressés ({visibleInterests.length})
        </h2>
        <ul className="mt-4 flex flex-col gap-2">
          {visibleInterests.map((interest) => (
            <li key={interest.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
              <Link href={`/admin/prospects/${interest.prospect.id}`} className="text-sm font-medium text-anthracite-900 hover:text-gold-600">
                {interest.prospect.companyName ||
                  [interest.prospect.firstName, interest.prospect.lastName].filter(Boolean).join(" ") ||
                  interest.prospect.reference}
              </Link>
              <Badge tone="outline">{interestLevelLabels[interest.interestLevel]}</Badge>
            </li>
          ))}
          {visibleInterests.length === 0 && <p className="text-sm text-anthracite-400">Aucun prospect intéressé pour le moment.</p>}
        </ul>

        <h2 className="mt-8 font-display text-lg font-semibold text-anthracite-950">Visites ({visibleVisits.length})</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {visibleVisits.map((visit) => (
            <li key={visit.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-anthracite-900">
                  {visit.prospect.companyName || [visit.prospect.firstName, visit.prospect.lastName].filter(Boolean).join(" ") || visit.prospect.reference}
                </span>
                <span className="text-xs text-anthracite-400">{formatDateTime(visit.scheduledStart)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="outline">{visitStatusLabels[visit.status]}</Badge>
                <Link href={`/admin/visites/${visit.id}`} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                  Voir
                </Link>
              </div>
            </li>
          ))}
          {visibleVisits.length === 0 && <p className="text-sm text-anthracite-400">Aucune visite planifiée pour ce bien.</p>}
        </ul>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-anthracite-950">Opportunités liées ({visibleOpportunities.length})</h2>
          {canCreateOpportunity(user.role) && (
            <Button href={`/admin/opportunites/nouveau?propertyId=${property.id}`} variant="ghost" size="sm" className="border border-anthracite-200 hover:border-gold-500">
              + Créer une opportunité
            </Button>
          )}
        </div>
        {visibleOpportunities.some((opportunity) => propertyAvailabilityAlert(property, opportunity.stage)) && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            Ce bien est archivé ou indisponible alors que des opportunités sont encore ouvertes.
          </p>
        )}
        <ul className="mt-4 flex flex-col gap-2">
          {visibleOpportunities.map((opportunity) => (
            <li key={opportunity.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-anthracite-100 p-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-anthracite-900">{opportunity.title}</span>
                <span className="text-xs text-anthracite-400">
                  {opportunity.reference} ·{" "}
                  {opportunity.prospect.companyName ||
                    [opportunity.prospect.firstName, opportunity.prospect.lastName].filter(Boolean).join(" ") ||
                    opportunity.prospect.reference}{" "}
                  · {opportunity.probability} % · {opportunity.assignedTo?.name ?? opportunity.assignedTo?.email ?? "Non assignée"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={isClosedStage(opportunity.stage) ? "anthracite" : "outline"}>{opportunityStageLabels[opportunity.stage]}</Badge>
                <Link href={`/admin/opportunites/${opportunity.id}`} className="text-xs font-medium text-gold-600 hover:text-gold-500">
                  Voir
                </Link>
              </div>
            </li>
          ))}
          {visibleOpportunities.length === 0 && <p className="text-sm text-anthracite-400">Aucune opportunité liée à ce bien.</p>}
        </ul>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-400">{label}</span>
      <span className="text-sm font-medium text-anthracite-900">{value}</span>
    </div>
  );
}
