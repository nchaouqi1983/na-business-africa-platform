import "server-only";
import {
  transactionFromDb,
  propertyTypeFromDb,
  propertyStatusFromDb,
  conditionFromDb,
  furnishedFromDb,
  orientationFromDb,
  tagCategoryFromDb,
} from "@/lib/admin/property-enum-maps";
import { propertyTypeGroup, moroccoRegionsByCity, type Property, type TagCategory } from "@/lib/property-schema";
import { exteriorEquipmentKeys, comfortEquipmentKeys, securityEquipmentKeys, leisureEquipmentKeys, technicalEquipmentKeys, legalEquipmentKeys, marketingEquipmentKeys } from "@/lib/property-schema";
import { publicMediaVariantUrl, publicDocumentUrl } from "@/lib/public-catalog/public-urls";
import { gradientForKey } from "@/lib/public-catalog/gradients";
import { mapDetailsToPublic, elevatorFromDetails } from "@/lib/public-catalog/details-mapper";
import type { PublicPropertyRow } from "@/lib/public-catalog/queries";

const EQUIPMENT_KEYS_BY_CATEGORY: Record<string, readonly string[]> = {
  exterieur: exteriorEquipmentKeys,
  confort: comfortEquipmentKeys,
  securite: securityEquipmentKeys,
  loisirs: leisureEquipmentKeys,
  technique: technicalEquipmentKeys,
  juridique: legalEquipmentKeys,
  marketing: marketingEquipmentKeys,
};

function toNumber(value: { toNumber(): number } | null | undefined): number | undefined {
  return value ? value.toNumber() : undefined;
}

/** Maps a Prisma `Property` row (see PUBLIC_PROPERTY_SELECT) to the public catalogue's `Property` DTO. Never pass a raw Prisma row to a client component — always go through this. */
export function toPublicProperty(row: PublicPropertyRow): Property {
  const type = propertyTypeFromDb[row.propertyType];
  const group = propertyTypeGroup[type];
  const transaction = transactionFromDb[row.transaction];
  const isOffMarket = row.visibility === "OFF_MARKET";
  const isPublic = row.publicationStatus === "PUBLIE" && row.visibility === "PUBLIC";

  const tagSlugs = row.tags.map((tag) => tag.slug);
  const tagCategoryBySlug = new Map(row.tags.map((tag) => [tag.slug, tagCategoryFromDb[tag.category]]));

  function activeEquipment(category: TagCategory): Record<string, boolean> {
    const knownKeys = new Set(EQUIPMENT_KEYS_BY_CATEGORY[category] ?? []);
    const active: Record<string, boolean> = {};
    for (const slug of tagSlugs) {
      if (tagCategoryBySlug.get(slug) === category && knownKeys.has(slug)) active[slug] = true;
    }
    return active;
  }

  const views = tagSlugs.filter((slug) => tagCategoryBySlug.get(slug) === "vue");
  const environment = tagSlugs.filter((slug) => tagCategoryBySlug.get(slug) === "environnement");

  const sortedMedia = [...row.media].sort((a, b) => a.sortOrder - b.sortOrder);
  const cover = sortedMedia.find((item) => item.isCover) ?? sortedMedia[0];
  const gallery = sortedMedia.map((item) => publicMediaVariantUrl(item.id, "gallery"));

  const price = row.price ? row.price.toNumber() : undefined;
  const priceByTransaction: Pick<Property["price"], "priceMAD" | "monthlyRent" | "seasonalNightly"> = {};
  if (price !== undefined) {
    if (transaction === "location") priceByTransaction.monthlyRent = price;
    else if (transaction === "location-saisonniere") priceByTransaction.seasonalNightly = price;
    else priceByTransaction.priceMAD = price;
  }

  const brochure = row.documents.find((entry) => entry.type === "BROCHURE");
  const plans = row.documents.filter((entry) => entry.type === "PLAN");
  const video = row.externalLinks.find((link) => link.type === "VIDEO_YOUTUBE" || link.type === "VIDEO_VIMEO");
  const virtualTour = row.externalLinks.find((link) => link.type === "VISITE_VIRTUELLE");

  const publishedAtIso = row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : undefined;

  const property: Property = {
    id: row.id,
    reference: row.reference,
    slug: row.slug,
    title: { fr: row.titleFr, en: row.titleFr },
    description: { fr: row.descriptionFr ?? row.shortDescription ?? "", en: row.descriptionFr ?? row.shortDescription ?? "" },
    transaction,
    type,
    subType: row.propertySubtype ?? undefined,
    commercialStatus: isOffMarket ? "off-market" : propertyStatusFromDb[row.status],
    visibility: {
      isPublic,
      isExclusive: false,
      isOffMarket,
      isCoupDeCoeur: row.isCoupDeCoeur,
      isNew: tagSlugs.includes("nouveau"),
      isBonneAffaire: row.isGoodDeal,
    },
    dates: {
      entryDate: row.createdAt.toISOString().slice(0, 10),
      publishedAt: publishedAtIso,
      updatedAt: row.updatedAt.toISOString().slice(0, 10),
    },
    agentId: row.assignedToId ?? row.createdById,
    seo: {
      title: { fr: row.titleFr, en: row.titleFr },
      description: {
        fr: row.shortDescription ?? row.descriptionFr?.slice(0, 155) ?? row.titleFr,
        en: row.shortDescription ?? row.descriptionFr?.slice(0, 155) ?? row.titleFr,
      },
      displayPriority: row.isFeatured ? 100 : 50,
    },

    location: {
      country: "Maroc",
      region: moroccoRegionsByCity[row.city] ?? "Maroc",
      city: row.city,
      district: row.district ?? undefined,
      mapPrecision: isOffMarket ? "masquee" : row.latitude !== null && row.longitude !== null ? "exacte" : "approximative",
      orientation: row.orientation ? orientationFromDb[row.orientation] : undefined,
      latitude: isOffMarket ? undefined : row.latitude ?? undefined,
      longitude: isOffMarket ? undefined : row.longitude ?? undefined,
      views,
      environment,
      proximities: {},
    },

    price: {
      ...priceByTransaction,
      priceOnRequest: row.priceOnRequest,
      negotiable: row.negotiable,
      pricePerSqm: toNumber(row.pricePerSqm),
      charges: toNumber(row.monthlyCharges),
      securityDeposit: toNumber(row.securityDeposit),
      commission: {},
      estimatedYieldPercent: toNumber(row.estimatedYieldPercent),
      creditEligible: row.isCreditEligible,
      mourabahaEligible: row.isMourabahaEligible,
      paymentConditions: [],
    },

    layout: {
      livingArea: row.livingArea ?? undefined,
      builtArea: row.builtArea ?? undefined,
      landArea: row.landArea ?? undefined,
      terraceArea: row.terraceArea ?? undefined,
      balconyArea: row.balconyArea ?? undefined,
      basementArea: row.basementArea ?? undefined,
      bedrooms: row.bedrooms ?? undefined,
      suites: row.suites ?? undefined,
      bathrooms: row.bathrooms ?? undefined,
      livingRooms: row.salons ?? undefined,
      kitchens: row.kitchens ?? undefined,
      parkingSpaces: row.parkingSpaces ?? undefined,
      floor: row.floor ?? undefined,
      totalFloors: row.totalFloors ?? undefined,
      elevator: elevatorFromDetails(group, row.details),
      yearBuilt: row.yearBuilt ?? undefined,
      condition: row.condition ? conditionFromDb[row.condition] : undefined,
      availability: undefined,
      furnished: row.furnished ? furnishedFromDb[row.furnished] : undefined,
    },

    equipment: {
      exterior: activeEquipment("exterieur"),
      comfort: activeEquipment("confort"),
      security: activeEquipment("securite"),
      leisure: activeEquipment("loisirs"),
      technical: activeEquipment("technique"),
      legal: activeEquipment("juridique"),
      marketing: activeEquipment("marketing"),
    },

    details: mapDetailsToPublic(group, row.details),

    tags: tagSlugs,

    media: {
      coverImage: cover ? publicMediaVariantUrl(cover.id, "large") : undefined,
      gallery,
      floorPlans: plans.length > 0 ? plans.map((entry) => publicDocumentUrl(entry.id)) : undefined,
      brochurePdf: brochure ? publicDocumentUrl(brochure.id) : undefined,
      video: video?.url,
      virtualTour: virtualTour?.url,
      confidentiality: isOffMarket ? "off-market" : "public",
      placeholderGradient: gradientForKey(row.id),
    },
  };

  return property;
}
