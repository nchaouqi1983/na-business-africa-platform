import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { listProperties, listDistinctCities, listAssignableUsers } from "@/lib/admin/property-queries";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import { canManageFinance } from "@/lib/finance/permissions";
import { canEditProperty, canPublishProperty } from "@/lib/property-permissions";
import { publishProperty, unpublishProperty } from "@/lib/admin/property-actions";
import { listActiveProgramsWithLotsForPicker } from "@/lib/real-estate-network/program-queries";
import { listActiveTags } from "@/lib/admin/property-tags";
import {
  transactionFilterOptions,
  propertyTypeFilterOptions,
  propertyStatusFilterOptions,
  publicationStatusOptions,
  visibilityOptions,
  publicationStatusLabels,
  visibilityLabels,
  transactionFromDb,
  propertyTypeFromDb,
  propertyStatusFromDb,
  propertyStatusLabels,
  subtypeOptionsForType,
} from "@/lib/admin/property-enum-maps";
import { transactionLabels, propertyTypeLabels } from "@/lib/property-schema";
import { importSourceOptions } from "@/lib/admin/import-labels";
import { formatPrice, formatDateTime } from "@/lib/admin/format";
import type {
  PublicationStatus as DbPublicationStatus,
  Visibility as DbVisibility,
} from "@/lib/generated/prisma/client";
import Button from "@/components/Button";
import { inputClass, checkboxClass } from "./_components/FormField";
import PropertiesTable, { type PropertyRow } from "./_components/PropertiesTable";

export const metadata: Metadata = {
  title: "Biens | NA Business Africa",
  description: "Liste des biens de l'administration NA Business Africa.",
};

const publicationTone: Record<DbPublicationStatus, "gold" | "anthracite" | "outline"> = {
  BROUILLON: "outline",
  PUBLIE: "gold",
  ARCHIVE: "anthracite",
};

const visibilityTone: Record<DbVisibility, "gold" | "anthracite" | "outline"> = {
  PUBLIC: "outline",
  OFF_MARKET: "anthracite",
  PRIVE: "anthracite",
};

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function paramList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function matchEnum<T extends string>(value: string, allowed: readonly T[]): T | "" {
  return (allowed as readonly string[]).includes(value) ? (value as T) : "";
}

function parseNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default async function AdminPropertiesPage({ searchParams }: PageProps<"/admin/biens">) {
  const user = await requireAdminUser();
  const sp = await searchParams;

  const canSeeNetwork = canManageRealEstateNetwork(user.role);
  const canSeeFinance = canManageFinance(user.role);

  const q = paramValue(sp.q);
  const publication = matchEnum(paramValue(sp.publication), publicationStatusOptions.map((o) => o.value));
  const visibilite = matchEnum(paramValue(sp.visibilite), visibilityOptions.map((o) => o.value));
  const statut = matchEnum(paramValue(sp.statut), propertyStatusFilterOptions.map((o) => o.value));
  const transaction = matchEnum(paramValue(sp.transaction), transactionFilterOptions.map((o) => o.value));
  const type = matchEnum(paramValue(sp.type), propertyTypeFilterOptions.map((o) => o.value));
  const sousType = paramValue(sp.sous_type);
  const city = paramValue(sp.ville);
  const district = paramValue(sp.quartier);
  const prixMin = paramValue(sp.prix_min);
  const prixMax = paramValue(sp.prix_max);
  const surfaceMin = paramValue(sp.surface_min);
  const chambresMin = paramValue(sp.chambres_min);
  const tags = paramList(sp.tags);
  const aLaUne = paramValue(sp.a_la_une) === "1";
  const bonneAffaire = paramValue(sp.bonne_affaire) === "1";
  const coupDeCoeur = paramValue(sp.coup_de_coeur) === "1";
  const exclusif = paramValue(sp.exclusif) === "1";
  const creeDebut = paramValue(sp.cree_debut);
  const creeFin = paramValue(sp.cree_fin);
  const majDebut = paramValue(sp.maj_debut);
  const majFin = paramValue(sp.maj_fin);
  const agent = paramValue(sp.agent);
  const proprietaire = canSeeNetwork ? paramValue(sp.proprietaire) : "";
  const promoteur = canSeeNetwork ? paramValue(sp.promoteur) : "";
  const intermediaire = canSeeNetwork ? paramValue(sp.intermediaire) : "";
  // Exact-match variants used by the owner/promoter/intermediary 360° dashboard tiles (never shown as a text field in this form).
  const proprietaireId = canSeeNetwork ? paramValue(sp.proprietaire_id) : "";
  const promoteurId = canSeeNetwork ? paramValue(sp.promoteur_id) : "";
  const intermediaireId = canSeeNetwork ? paramValue(sp.intermediaire_id) : "";
  const programme = canSeeNetwork ? paramValue(sp.programme) : "";
  const lot = canSeeNetwork ? paramValue(sp.lot) : "";
  const mandatActif = canSeeFinance && paramValue(sp.mandat_actif) === "1";
  const mandatExclusif = canSeeFinance && paramValue(sp.mandat_exclusif) === "1";
  const mandatExpirant = canSeeFinance && paramValue(sp.mandat_expirant) === "1";
  const photos = matchEnum(paramValue(sp.photos), ["with", "without"] as const);
  const documents = matchEnum(paramValue(sp.documents), ["with", "without"] as const);
  const importSource = paramValue(sp.import_source);
  const sourceExternalId = paramValue(sp.source_external_id);
  const page = Number(paramValue(sp.page)) || 1;

  const [{ items, total, pageCount }, cities, assignableUsers, allTags, programs] = await Promise.all([
    listProperties(
      {
        q,
        publicationStatus: publication,
        visibility: visibilite,
        status: statut,
        transaction,
        propertyType: type,
        propertySubtype: sousType || undefined,
        city,
        district: district || undefined,
        priceMin: parseNumber(prixMin),
        priceMax: parseNumber(prixMax),
        surfaceMin: parseNumber(surfaceMin),
        bedroomsMin: parseNumber(chambresMin),
        tags,
        isFeatured: aLaUne,
        isGoodDeal: bonneAffaire,
        isCoupDeCoeur: coupDeCoeur,
        isExclusive: exclusif,
        createdFrom: creeDebut || undefined,
        createdTo: creeFin || undefined,
        updatedFrom: majDebut || undefined,
        updatedTo: majFin || undefined,
        assignedToId: agent || undefined,
        ownerQuery: proprietaire || undefined,
        promoterQuery: promoteur || undefined,
        intermediaryQuery: intermediaire || undefined,
        ownerId: proprietaireId || undefined,
        promoterId: promoteurId || undefined,
        intermediaryId: intermediaireId || undefined,
        developmentProgramId: programme || undefined,
        developmentLotId: lot || undefined,
        mandateActive: mandatActif,
        mandateExclusive: mandatExclusif,
        mandateExpiring: mandatExpirant,
        hasPhotos: photos,
        hasDocuments: documents,
        importSource: importSource || undefined,
        sourceExternalId: sourceExternalId || undefined,
        page,
      },
      user.role
    ),
    listDistinctCities(),
    listAssignableUsers(),
    listActiveTags(),
    canSeeNetwork ? listActiveProgramsWithLotsForPicker() : Promise.resolve([]),
  ]);

  const selectedProgram = programs.find((p) => p.id === programme);
  const subtypeOptions = type ? subtypeOptionsForType(propertyTypeFromDb[type]) : [];

  function buildHref(overrides: Record<string, string>): string {
    const params = new URLSearchParams();
    const current: Record<string, string> = {
      q,
      publication,
      visibilite,
      statut,
      transaction,
      type,
      sous_type: sousType,
      ville: city,
      quartier: district,
      prix_min: prixMin,
      prix_max: prixMax,
      surface_min: surfaceMin,
      chambres_min: chambresMin,
      a_la_une: aLaUne ? "1" : "",
      bonne_affaire: bonneAffaire ? "1" : "",
      coup_de_coeur: coupDeCoeur ? "1" : "",
      exclusif: exclusif ? "1" : "",
      cree_debut: creeDebut,
      cree_fin: creeFin,
      maj_debut: majDebut,
      maj_fin: majFin,
      agent,
      proprietaire,
      promoteur,
      intermediaire,
      proprietaire_id: proprietaireId,
      promoteur_id: promoteurId,
      intermediaire_id: intermediaireId,
      programme,
      lot,
      mandat_actif: mandatActif ? "1" : "",
      mandat_exclusif: mandatExclusif ? "1" : "",
      mandat_expirant: mandatExpirant ? "1" : "",
      photos,
      documents,
      import_source: importSource,
      source_external_id: sourceExternalId,
      ...overrides,
    };
    for (const [key, value] of Object.entries(current)) if (value) params.set(key, value);
    for (const tag of tags) params.append("tags", tag);
    const query = params.toString();
    return query ? `/admin/biens?${query}` : "/admin/biens";
  }

  const hasFilters = Boolean(
    q ||
      publication ||
      visibilite ||
      statut ||
      transaction ||
      type ||
      sousType ||
      city ||
      district ||
      prixMin ||
      prixMax ||
      surfaceMin ||
      chambresMin ||
      tags.length > 0 ||
      aLaUne ||
      bonneAffaire ||
      coupDeCoeur ||
      exclusif ||
      creeDebut ||
      creeFin ||
      majDebut ||
      majFin ||
      agent ||
      proprietaire ||
      promoteur ||
      intermediaire ||
      programme ||
      lot ||
      mandatActif ||
      mandatExclusif ||
      mandatExpirant ||
      photos ||
      documents ||
      importSource ||
      sourceExternalId
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Biens</span>
          <h1 className="font-display text-3xl font-semibold text-anthracite-950">
            {total} bien{total > 1 ? "s" : ""}
          </h1>
        </div>
        <Button href="/admin/biens/nouveau" size="sm">
          Ajouter un bien
        </Button>
      </div>

      <form method="get" className="flex flex-col gap-4 rounded-2xl border border-anthracite-100 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Recherche</span>
            <input type="text" name="q" defaultValue={q} placeholder="Référence, titre, description…" className={inputClass} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Publication</span>
            <select name="publication" defaultValue={publication} className={inputClass}>
              <option value="">Tous (hors archives)</option>
              {publicationStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Transaction</span>
            <select name="transaction" defaultValue={transaction} className={inputClass}>
              <option value="">Toutes</option>
              {transactionFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Type</span>
            <select name="type" defaultValue={type} className={inputClass}>
              <option value="">Tous</option>
              {propertyTypeFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Ville</span>
            <select name="ville" defaultValue={city} className={inputClass}>
              <option value="">Toutes</option>
              {cities.map((cityOption) => (
                <option key={cityOption} value={cityOption}>
                  {cityOption}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Agent assigné</span>
            <select name="agent" defaultValue={agent} className={inputClass}>
              <option value="">Tous</option>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </label>
        </div>

        <details className="group rounded-xl border border-anthracite-100" open={hasFilters}>
          <summary className="cursor-pointer select-none rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-wider text-anthracite-500 hover:text-gold-600">
            Filtres avancés
          </summary>

          <div className="flex flex-col gap-6 border-t border-anthracite-100 p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Sous-type</span>
                <select name="sous_type" defaultValue={sousType} className={inputClass} disabled={!type}>
                  <option value="">{type ? "Tous" : "Choisir un type d'abord"}</option>
                  {subtypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Statut métier</span>
                <select name="statut" defaultValue={statut} className={inputClass}>
                  <option value="">Tous</option>
                  {propertyStatusFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Visibilité</span>
                <select name="visibilite" defaultValue={visibilite} className={inputClass}>
                  <option value="">Toutes</option>
                  {visibilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Quartier</span>
                <input type="text" name="quartier" defaultValue={district} className={inputClass} />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Prix min (MAD)</span>
                <input type="number" name="prix_min" defaultValue={prixMin} min={0} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Prix max (MAD)</span>
                <input type="number" name="prix_max" defaultValue={prixMax} min={0} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Surface min (m²)</span>
                <input type="number" name="surface_min" defaultValue={surfaceMin} min={0} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Chambres min</span>
                <input type="number" name="chambres_min" defaultValue={chambresMin} min={0} className={inputClass} />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Créé entre</span>
                <div className="flex gap-2">
                  <input type="date" name="cree_debut" defaultValue={creeDebut} className={inputClass} />
                  <input type="date" name="cree_fin" defaultValue={creeFin} className={inputClass} />
                </div>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Modifié entre</span>
                <div className="flex gap-2">
                  <input type="date" name="maj_debut" defaultValue={majDebut} className={inputClass} />
                  <input type="date" name="maj_fin" defaultValue={majFin} className={inputClass} />
                </div>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Photos</span>
                <select name="photos" defaultValue={photos} className={inputClass}>
                  <option value="">Indifférent</option>
                  <option value="with">Avec photos</option>
                  <option value="without">Sans photo</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Documents</span>
                <select name="documents" defaultValue={documents} className={inputClass}>
                  <option value="">Indifférent</option>
                  <option value="with">Avec documents</option>
                  <option value="without">Sans document</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Source import</span>
                <select name="import_source" defaultValue={importSource} className={inputClass}>
                  <option value="">Toutes</option>
                  {importSourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">N° externe (sourceExternalId)</span>
                <input type="text" name="source_external_id" defaultValue={sourceExternalId} className={inputClass} />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Tags</span>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {allTags.map((tag) => (
                  <label key={tag.slug} className="flex items-center gap-1.5 text-sm text-anthracite-700">
                    <input type="checkbox" name="tags" value={tag.slug} defaultChecked={tags.includes(tag.slug)} className={checkboxClass} />
                    {tag.labelFr}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <label className="flex items-center gap-1.5 text-sm text-anthracite-700">
                <input type="checkbox" name="a_la_une" value="1" defaultChecked={aLaUne} className={checkboxClass} />À la une
              </label>
              <label className="flex items-center gap-1.5 text-sm text-anthracite-700">
                <input type="checkbox" name="coup_de_coeur" value="1" defaultChecked={coupDeCoeur} className={checkboxClass} />
                Coup de cœur
              </label>
              <label className="flex items-center gap-1.5 text-sm text-anthracite-700">
                <input type="checkbox" name="bonne_affaire" value="1" defaultChecked={bonneAffaire} className={checkboxClass} />
                Bonne affaire
              </label>
              <label className="flex items-center gap-1.5 text-sm text-anthracite-700">
                <input type="checkbox" name="exclusif" value="1" defaultChecked={exclusif} className={checkboxClass} />
                Exclusivité
              </label>
            </div>

            {canSeeNetwork && (
              <div className="flex flex-col gap-4 border-t border-anthracite-100 pt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Réseau immobilier</span>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-xs text-anthracite-500">Propriétaire (nom, tél., e-mail)</span>
                    <input type="text" name="proprietaire" defaultValue={proprietaire} className={inputClass} />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-xs text-anthracite-500">Promoteur (société, tél., e-mail)</span>
                    <input type="text" name="promoteur" defaultValue={promoteur} className={inputClass} />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-xs text-anthracite-500">Intermédiaire (nom, tél., e-mail)</span>
                    <input type="text" name="intermediaire" defaultValue={intermediaire} className={inputClass} />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-xs text-anthracite-500">Programme neuf</span>
                    <select name="programme" defaultValue={programme} className={inputClass}>
                      <option value="">Tous</option>
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.promoter.companyName}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedProgram && (
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="text-xs text-anthracite-500">Lot</span>
                      <select name="lot" defaultValue={lot} className={inputClass}>
                        <option value="">Tous</option>
                        {selectedProgram.lots.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.reference}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              </div>
            )}

            {canSeeFinance && (
              <div className="flex flex-col gap-2 border-t border-anthracite-100 pt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Mandat</span>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <label className="flex items-center gap-1.5 text-sm text-anthracite-700">
                    <input type="checkbox" name="mandat_actif" value="1" defaultChecked={mandatActif} className={checkboxClass} />
                    Mandat actif
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-anthracite-700">
                    <input type="checkbox" name="mandat_exclusif" value="1" defaultChecked={mandatExclusif} className={checkboxClass} />
                    Mandat exclusif
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-anthracite-700">
                    <input type="checkbox" name="mandat_expirant" value="1" defaultChecked={mandatExpirant} className={checkboxClass} />
                    Mandat expirant bientôt
                  </label>
                </div>
              </div>
            )}
          </div>
        </details>

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm">
            Filtrer
          </Button>
          {hasFilters && (
            <Link href="/admin/biens" className="text-sm text-anthracite-500 hover:text-gold-600">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-anthracite-200 bg-white p-16 text-center">
          <p className="font-display text-lg text-anthracite-900">
            {hasFilters ? "Aucun bien ne correspond à ces critères." : "Aucun bien enregistré pour le moment."}
          </p>
          <p className="max-w-md text-sm text-anthracite-500">
            {hasFilters
              ? "Essayez d'élargir votre recherche ou de réinitialiser les filtres."
              : "Créez le premier bien pour commencer à alimenter le registre."}
          </p>
          {!hasFilters && (
            <Button href="/admin/biens/nouveau" size="sm">
              Ajouter un bien
            </Button>
          )}
        </div>
      ) : (
        <PropertiesTable items={items.map((property): PropertyRow => {
          const photoId = property.media[0]?.id ?? null;
          return {
            id: property.id,
            reference: property.reference,
            titleFr: property.titleFr,
            photoUrl: photoId ? `/api/admin/media/${photoId}/thumb` : null,
            typeLabel: propertyTypeLabels[propertyTypeFromDb[property.propertyType]],
            transactionLabel: transactionLabels[transactionFromDb[property.transaction]],
            city: property.city,
            priceLabel: formatPrice(property.price, property.priceOnRequest),
            statusLabel: propertyStatusLabels[propertyStatusFromDb[property.status]],
            publicationLabel: publicationStatusLabels[property.publicationStatus],
            publicationTone: publicationTone[property.publicationStatus],
            visibilityLabel: visibilityLabels[property.visibility],
            visibilityTone: visibilityTone[property.visibility],
            mediaCount: property._count.media,
            documentCount: property._count.documents,
            agentName: property.assignedTo?.name ?? property.assignedTo?.email ?? "—",
            updatedAtLabel: formatDateTime(property.updatedAt),
            canEdit: canEditProperty(user.role, user.id, property),
            canPublish: canPublishProperty(user.role),
            isArchived: property.publicationStatus === "ARCHIVE",
            isPublished: property.publicationStatus === "PUBLIE",
            publishAction: publishProperty.bind(null, property.id),
            unpublishAction: unpublishProperty.bind(null, property.id),
          };
        })} />
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <Link
              key={pageNumber}
              href={buildHref({ page: String(pageNumber) })}
              className={[
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
                pageNumber === page
                  ? "bg-anthracite-900 text-white"
                  : "border border-anthracite-200 text-anthracite-600 hover:border-gold-400",
              ].join(" ")}
            >
              {pageNumber}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
