import * as z from "zod";
import { programStatusValues } from "@/lib/real-estate-network/enum-labels";
import {
  optionalString,
  optionalNumberInRange,
  optionalNonNegativeInt,
  emptyToUndefined,
} from "@/lib/admin/zod-helpers";

export const programFormSchema = z.object({
  promoterId: z.string().trim().min(1, { error: "Promoteur requis." }),
  name: z.string().trim().min(1, { error: "Nom du programme requis." }).max(200),
  city: z.string().trim().min(1, { error: "Ville requise." }).max(120),
  district: optionalString(120),
  address: optionalString(240),
  latitude: optionalNumberInRange(-90, 90),
  longitude: optionalNumberInRange(-180, 180),
  internalDescription: optionalString(4000),
  status: z.enum(programStatusValues, { error: "Statut invalide." }).default("ETUDE"),
  expectedDeliveryDate: z.preprocess(emptyToUndefined, z.string().optional()),
  indicativeLotCount: optionalNonNegativeInt,
});

export type ProgramFormInput = z.infer<typeof programFormSchema>;

export function parseProgramForm(formData: FormData) {
  return programFormSchema.safeParse({
    promoterId: formData.get("promoterId"),
    name: formData.get("name"),
    city: formData.get("city"),
    district: formData.get("district"),
    address: formData.get("address"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    internalDescription: formData.get("internalDescription"),
    status: formData.get("status"),
    expectedDeliveryDate: formData.get("expectedDeliveryDate"),
    indicativeLotCount: formData.get("indicativeLotCount"),
  });
}
