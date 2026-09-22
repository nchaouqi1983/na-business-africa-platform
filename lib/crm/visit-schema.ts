import * as z from "zod";
import { visitStatusValues, visitTypeValues, postVisitInterestValues } from "@/lib/crm/enum-labels";
import { optionalString, optionalNonNegativeInt, emptyToUndefined } from "@/lib/admin/zod-helpers";

/** <input type="datetime-local"> value, e.g. "2026-09-22T14:30". */
const dateTimeLocal = z.string().trim().min(1, { error: "Date et heure requises." });
const optionalDateTimeLocal = z.preprocess(emptyToUndefined, z.string().trim().optional());

export const visitFormSchema = z.object({
  assignedToId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  scheduledStart: dateTimeLocal,
  scheduledEnd: optionalDateTimeLocal,
  status: z.enum(visitStatusValues, { error: "Statut invalide." }).default("PLANIFIEE"),
  type: z.enum(visitTypeValues, { error: "Type de visite invalide." }).default("PREMIERE_VISITE"),
  participantsCount: optionalNonNegativeInt,
  preVisitNote: optionalString(2000),
  prospectFeedback: optionalString(2000),
  internalNote: optionalString(2000),
  postVisitInterest: z.preprocess(emptyToUndefined, z.enum(postVisitInterestValues).optional()),
  nextFollowUpAt: optionalDateTimeLocal,
});

export type VisitFormInput = z.infer<typeof visitFormSchema>;

export function parseVisitForm(formData: FormData) {
  return visitFormSchema.safeParse({
    assignedToId: formData.get("assignedToId"),
    scheduledStart: formData.get("scheduledStart"),
    scheduledEnd: formData.get("scheduledEnd"),
    status: formData.get("status"),
    type: formData.get("type"),
    participantsCount: formData.get("participantsCount"),
    preVisitNote: formData.get("preVisitNote"),
    prospectFeedback: formData.get("prospectFeedback"),
    internalNote: formData.get("internalNote"),
    postVisitInterest: formData.get("postVisitInterest"),
    nextFollowUpAt: formData.get("nextFollowUpAt"),
  });
}
