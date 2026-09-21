import type { Metadata } from "next";
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

  const [allTags, assignableUsers, privateData, media, documents, links] = await Promise.all([
    listActiveTags(),
    canAssign ? listAssignableUsers() : Promise.resolve([]),
    canSeePrivate ? getPropertyPrivateById(id) : Promise.resolve(null),
    canEdit ? listPropertyMedia(id) : Promise.resolve([]),
    canEdit ? listPropertyDocuments(id, canSeeRestrictedDocuments) : Promise.resolve([]),
    canEdit ? listPropertyExternalLinks(id) : Promise.resolve([]),
  ]);

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
