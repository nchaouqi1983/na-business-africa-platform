import type { PropertyTypeGroup } from "@/lib/property-schema";
import type { PropertyDetailsInput } from "@/lib/admin/property-details-schema";
import { Field, CheckboxField, inputClass } from "./FormField";

type Defaults = Partial<PropertyDetailsInput> & { kind?: PropertyTypeGroup };

type PropertyDetailsFieldsProps = {
  group: PropertyTypeGroup;
  defaults?: Defaults;
  fieldErrors?: Record<string, string>;
};

function err(fieldErrors: Record<string, string> | undefined, field: string) {
  return fieldErrors?.[`details.${field}`];
}

export default function PropertyDetailsFields({ group, defaults, fieldErrors }: PropertyDetailsFieldsProps) {
  const d = defaults?.kind === group ? defaults : undefined;

  switch (group) {
    case "villa-maison-riad":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <CheckboxField label="Piscine" name="details.pool" defaultChecked={d && "pool" in d ? d.pool : false} />
          <CheckboxField label="Jardin" name="details.garden" defaultChecked={d && "garden" in d ? d.garden : false} />
          <CheckboxField
            label="Dépendances"
            name="details.outbuildings"
            defaultChecked={d && "outbuildings" in d ? d.outbuildings : false}
          />
          <CheckboxField
            label="Rooftop"
            name="details.rooftop"
            defaultChecked={d && "rooftop" in d ? d.rooftop : false}
          />
          <CheckboxField
            label="Cheminée"
            name="details.fireplace"
            defaultChecked={d && "fireplace" in d ? d.fireplace : false}
          />
          <CheckboxField label="Hammam" name="details.hammam" defaultChecked={d && "hammam" in d ? d.hammam : false} />
          <Field label="Vue" error={err(fieldErrors, "view")}>
            <input name="details.view" defaultValue={d && "view" in d ? d.view : undefined} className={inputClass} />
          </Field>
        </div>
      );

    case "appartement-duplex-penthouse":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nom de la résidence" error={err(fieldErrors, "residenceName")}>
            <input
              name="details.residenceName"
              defaultValue={d && "residenceName" in d ? d.residenceName : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Position de l'étage">
            <select
              name="details.floorPosition"
              defaultValue={d && "floorPosition" in d ? (d.floorPosition ?? "") : ""}
              className={inputClass}
            >
              <option value="">—</option>
              <option value="rdc">Rez-de-chaussée</option>
              <option value="intermediaire">Étage intermédiaire</option>
              <option value="dernier-etage">Dernier étage</option>
            </select>
          </Field>
          <CheckboxField
            label="Ascenseur"
            name="details.elevator"
            defaultChecked={d && "elevator" in d ? d.elevator : false}
          />
          <CheckboxField
            label="Terrasse"
            name="details.terrace"
            defaultChecked={d && "terrace" in d ? d.terrace : false}
          />
          <CheckboxField
            label="Concierge"
            name="details.concierge"
            defaultChecked={d && "concierge" in d ? d.concierge : false}
          />
          <CheckboxField
            label="Parking inclus"
            name="details.parkingIncluded"
            defaultChecked={d && "parkingIncluded" in d ? d.parkingIncluded : false}
          />
        </div>
      );

    case "terrain":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Zonage" error={err(fieldErrors, "zoning")}>
            <input name="details.zoning" defaultValue={d && "zoning" in d ? d.zoning : undefined} className={inputClass} />
          </Field>
          <Field label="Façade (mètres)" error={err(fieldErrors, "frontageMeters")}>
            <input
              type="number"
              min="0"
              step="0.1"
              name="details.frontageMeters"
              defaultValue={d && "frontageMeters" in d ? d.frontageMeters : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Titre foncier">
            <select
              name="details.titleDeed"
              defaultValue={d && "titleDeed" in d ? (d.titleDeed ?? "") : ""}
              className={inputClass}
            >
              <option value="">—</option>
              <option value="titre-foncier">Titre foncier</option>
              <option value="melkia">Melkia</option>
              <option value="requisition-immatriculation">Réquisition d&apos;immatriculation</option>
            </select>
          </Field>
          <Field label="Pente (%)" error={err(fieldErrors, "slopePercent")}>
            <input
              type="number"
              min="0"
              step="0.1"
              name="details.slopePercent"
              defaultValue={d && "slopePercent" in d ? d.slopePercent : undefined}
              className={inputClass}
            />
          </Field>
          <CheckboxField
            label="Constructible"
            name="details.buildable"
            defaultChecked={d && "buildable" in d ? d.buildable : false}
          />
          <CheckboxField
            label="Raccordements (eau/électricité)"
            name="details.utilitiesConnected"
            defaultChecked={d && "utilitiesConnected" in d ? d.utilitiesConnected : false}
          />
          <Field label="Vue" error={err(fieldErrors, "view")}>
            <input name="details.view" defaultValue={d && "view" in d ? d.view : undefined} className={inputClass} />
          </Field>
        </div>
      );

    case "hotel-maison-hotes":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nombre de chambres" error={err(fieldErrors, "roomsCount")}>
            <input
              type="number"
              min="0"
              step="1"
              name="details.roomsCount"
              defaultValue={d && "roomsCount" in d ? d.roomsCount : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Capacité (personnes)" error={err(fieldErrors, "capacityGuests")}>
            <input
              type="number"
              min="0"
              step="1"
              name="details.capacityGuests"
              defaultValue={d && "capacityGuests" in d ? d.capacityGuests : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Type de licence" error={err(fieldErrors, "licenseType")}>
            <input
              name="details.licenseType"
              defaultValue={d && "licenseType" in d ? d.licenseType : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Taux d'occupation (%)" error={err(fieldErrors, "occupancyRatePercent")}>
            <input
              type="number"
              min="0"
              step="0.1"
              name="details.occupancyRatePercent"
              defaultValue={d && "occupancyRatePercent" in d ? d.occupancyRatePercent : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="CA indicatif interne (MAD)" error={err(fieldErrors, "indicativeRevenueInternal")}>
            <input
              type="number"
              min="0"
              step="1"
              name="details.indicativeRevenueInternal"
              defaultValue={d && "indicativeRevenueInternal" in d ? d.indicativeRevenueInternal : undefined}
              className={inputClass}
            />
          </Field>
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:gap-6">
            <CheckboxField
              label="Restaurant sur place"
              name="details.restaurantOnSite"
              defaultChecked={d && "restaurantOnSite" in d ? d.restaurantOnSite : false}
            />
            <CheckboxField label="Spa" name="details.spa" defaultChecked={d && "spa" in d ? d.spa : false} />
            <CheckboxField label="Piscine" name="details.pool" defaultChecked={d && "pool" in d ? d.pool : false} />
          </div>
        </div>
      );

    case "commerce-bureau-depot":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Type d'activité" error={err(fieldErrors, "activityType")}>
            <input
              name="details.activityType"
              defaultValue={d && "activityType" in d ? d.activityType : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Licence" error={err(fieldErrors, "license")}>
            <input name="details.license" defaultValue={d && "license" in d ? d.license : undefined} className={inputClass} />
          </Field>
          <Field label="Surface de vente (m²)" error={err(fieldErrors, "salesAreaSqm")}>
            <input
              type="number"
              min="0"
              step="0.1"
              name="details.salesAreaSqm"
              defaultValue={d && "salesAreaSqm" in d ? d.salesAreaSqm : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Surface de réserve (m²)" error={err(fieldErrors, "storageAreaSqm")}>
            <input
              type="number"
              min="0"
              step="0.1"
              name="details.storageAreaSqm"
              defaultValue={d && "storageAreaSqm" in d ? d.storageAreaSqm : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Type de bail" error={err(fieldErrors, "leaseType")}>
            <input
              name="details.leaseType"
              defaultValue={d && "leaseType" in d ? d.leaseType : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Loyer mensuel du bail (MAD)" error={err(fieldErrors, "monthlyLeaseRent")}>
            <input
              type="number"
              min="0"
              step="1"
              name="details.monthlyLeaseRent"
              defaultValue={d && "monthlyLeaseRent" in d ? d.monthlyLeaseRent : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Fréquentation">
            <select
              name="details.footTraffic"
              defaultValue={d && "footTraffic" in d ? (d.footTraffic ?? "") : ""}
              className={inputClass}
            >
              <option value="">—</option>
              <option value="faible">Faible</option>
              <option value="moyen">Moyenne</option>
              <option value="eleve">Élevée</option>
            </select>
          </Field>
          <Field label="Hauteur sous plafond (m)" error={err(fieldErrors, "ceilingHeightMeters")}>
            <input
              type="number"
              min="0"
              step="0.1"
              name="details.ceilingHeightMeters"
              defaultValue={d && "ceilingHeightMeters" in d ? d.ceilingHeightMeters : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Salles de réunion" error={err(fieldErrors, "meetingRooms")}>
            <input
              type="number"
              min="0"
              step="1"
              name="details.meetingRooms"
              defaultValue={d && "meetingRooms" in d ? d.meetingRooms : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Sécurité" error={err(fieldErrors, "security")}>
            <input name="details.security" defaultValue={d && "security" in d ? d.security : undefined} className={inputClass} />
          </Field>
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:gap-6">
            <CheckboxField
              label="Open-space"
              name="details.openSpace"
              defaultChecked={d && "openSpace" in d ? d.openSpace : false}
            />
            <CheckboxField
              label="Quai de livraison"
              name="details.loadingDock"
              defaultChecked={d && "loadingDock" in d ? d.loadingDock : false}
            />
            <CheckboxField
              label="Accès camion"
              name="details.truckAccess"
              defaultChecked={d && "truckAccess" in d ? d.truckAccess : false}
            />
          </div>
        </div>
      );

    case "programme-neuf":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Promoteur (provisoire)" error={err(fieldErrors, "developerNameTemp")}>
            <input
              name="details.developerNameTemp"
              defaultValue={d && "developerNameTemp" in d ? d.developerNameTemp : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Nom du programme" error={err(fieldErrors, "programName")}>
            <input
              name="details.programName"
              defaultValue={d && "programName" in d ? d.programName : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Phase" error={err(fieldErrors, "phase")}>
            <input name="details.phase" defaultValue={d && "phase" in d ? d.phase : undefined} className={inputClass} />
          </Field>
          <Field label="Livraison prévue" error={err(fieldErrors, "deliveryDate")}>
            <input
              name="details.deliveryDate"
              placeholder="ex. T4 2027"
              defaultValue={d && "deliveryDate" in d ? d.deliveryDate : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Typologie" error={err(fieldErrors, "typology")}>
            <input
              name="details.typology"
              placeholder="ex. T2, villa, lot"
              defaultValue={d && "typology" in d ? d.typology : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Numéro de lot" error={err(fieldErrors, "lotNumber")}>
            <input
              name="details.lotNumber"
              defaultValue={d && "lotNumber" in d ? d.lotNumber : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Lots disponibles" error={err(fieldErrors, "unitsAvailable")}>
            <input
              type="number"
              min="0"
              step="1"
              name="details.unitsAvailable"
              defaultValue={d && "unitsAvailable" in d ? d.unitsAvailable : undefined}
              className={inputClass}
            />
          </Field>
        </div>
      );

    default:
      return null;
  }
}
