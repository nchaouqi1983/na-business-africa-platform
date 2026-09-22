import type { Prisma } from "@/lib/generated/prisma/client";
import type { PropertyDetails, PropertyTypeGroup } from "@/lib/property-schema";

/**
 * Translates the admin's free-form `Property.details` JSON (shaped by
 * lib/admin/property-details-schema.ts, one schema per PropertyTypeGroup)
 * into the public catalogue's PropertyDetails union (lib/property-schema.ts).
 *
 * The two shapes were designed independently and only partially overlap —
 * fields with no public counterpart (e.g. internal revenue estimates) are
 * simply dropped here, never forwarded. Anything that doesn't parse falls
 * back to `undefined`, which every consumer already treats as "no
 * specificities to show".
 */
export function mapDetailsToPublic(group: PropertyTypeGroup, raw: Prisma.JsonValue | null): PropertyDetails | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const details = raw as Record<string, unknown>;

  const str = (key: string): string | undefined => {
    const value = details[key];
    return typeof value === "string" && value.trim() !== "" ? value : undefined;
  };
  const num = (key: string): number | undefined => {
    const value = details[key];
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
  };
  const bool = (key: string): boolean | undefined => {
    const value = details[key];
    return typeof value === "boolean" ? value : undefined;
  };

  switch (group) {
    case "villa-maison-riad":
      // No field overlap with the admin shape (pool/garden/rooftop/fireplace/
      // hammam are booleans with no public equivalent) — nothing to surface.
      return undefined;

    case "appartement-duplex-penthouse": {
      const floorPosition = str("floorPosition");
      return {
        kind: "appartement-duplex-penthouse",
        residenceName: str("residenceName"),
        floorPosition:
          floorPosition === "rdc" || floorPosition === "intermediaire" || floorPosition === "dernier-etage"
            ? floorPosition
            : undefined,
        concierge: bool("concierge"),
      };
    }

    case "terrain": {
      const titleType = str("titleDeed");
      return {
        kind: "terrain",
        serviced: bool("utilitiesConnected"),
        titleType:
          titleType === "titre-foncier" || titleType === "melkia" || titleType === "requisition-immatriculation"
            ? titleType
            : undefined,
      };
    }

    case "hotel-maison-hotes":
      return {
        kind: "hotel-maison-hotes",
        roomsCount: num("roomsCount"),
        occupancyRatePercent: num("occupancyRatePercent"),
        licenseType: str("licenseType"),
        restaurantOnSite: bool("restaurantOnSite"),
      };

    case "commerce-bureau-depot": {
      const footTraffic = str("footTraffic");
      return {
        kind: "commerce-bureau-depot",
        activityType: str("activityType"),
        footTraffic: footTraffic === "faible" || footTraffic === "moyen" || footTraffic === "eleve" ? footTraffic : undefined,
        ceilingHeightMeters: num("ceilingHeightMeters"),
      };
    }

    case "programme-neuf":
      return {
        kind: "programme-neuf",
        programName: str("programName"),
        developerName: str("developerNameTemp"),
        deliveryDate: str("deliveryDate"),
        lotsAvailable: num("unitsAvailable"),
      };

    default:
      return undefined;
  }
}

/** appartement-duplex-penthouse is the only group where the admin captures elevator, inside `details`. */
export function elevatorFromDetails(group: PropertyTypeGroup, raw: Prisma.JsonValue | null): boolean | undefined {
  if (group !== "appartement-duplex-penthouse" || !raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }
  const value = (raw as Record<string, unknown>).elevator;
  return typeof value === "boolean" ? value : undefined;
}
