import * as z from "zod";
import { activityTypeValues, activityStatusValues } from "@/lib/crm/enum-labels";
import { optionalString, emptyToUndefined } from "@/lib/admin/zod-helpers";

const optionalDateTimeLocal = z.preprocess(emptyToUndefined, z.string().trim().optional());

export const activityFormSchema = z.object({
  type: z.preprocess(emptyToUndefined, z.enum(activityTypeValues, { error: "Type d'action invalide." }).default("TACHE")),
  title: z.string().trim().min(1, { error: "Titre requis." }).max(200),
  content: optionalString(2000),
  dueAt: optionalDateTimeLocal,
  // QuickActivityForm posts no status field (FormData.get → null): fall back to the default instead of rejecting.
  status: z.preprocess(emptyToUndefined, z.enum(activityStatusValues, { error: "Statut invalide." }).default("A_FAIRE")),
  assignedToId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

export type ActivityFormInput = z.infer<typeof activityFormSchema>;

export function parseActivityForm(formData: FormData) {
  return activityFormSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    content: formData.get("content"),
    dueAt: formData.get("dueAt"),
    status: formData.get("status"),
    assignedToId: formData.get("assignedToId"),
  });
}
