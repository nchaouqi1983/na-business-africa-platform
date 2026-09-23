"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth/dal";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";
import { canEditOrganizationSettings } from "@/lib/settings/permissions";
import { organizationSettingsFields, parseOrganizationSettingsForm } from "@/lib/settings/organization-schema";
import { ORGANIZATION_SETTINGS_ID } from "@/lib/settings/organization-queries";

export type OrganizationSettingsFormState =
  | {
      error?: string;
      success?: string;
      fieldErrors?: Record<string, string>;
      /** Submitted values echoed back after a failed save so React's post-action form reset doesn't wipe them. */
      values?: Record<string, string>;
    }
  | undefined;

export async function saveOrganizationSettings(
  _prevState: OrganizationSettingsFormState,
  formData: FormData
): Promise<OrganizationSettingsFormState> {
  const user = await requireAdminUser();
  if (!canEditOrganizationSettings(user.role)) {
    return { error: "Votre rôle ne permet pas de modifier les informations de l'agence." };
  }

  const parsed = parseOrganizationSettingsForm(formData);
  if (!parsed.success) {
    const values = Object.fromEntries(organizationSettingsFields.map((field) => [field, String(formData.get(field) ?? "")]));
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error), values };
  }

  // Optional fields left blank are stored as NULL, not left untouched.
  const input = parsed.data;
  const data = {
    agencyName: input.agencyName,
    tagline: input.tagline ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    whatsapp: input.whatsapp ?? null,
    address: input.address ?? null,
    city: input.city ?? null,
    website: input.website ?? null,
    instagramUrl: input.instagramUrl ?? null,
    facebookUrl: input.facebookUrl ?? null,
    linkedinUrl: input.linkedinUrl ?? null,
    defaultLanguage: input.defaultLanguage,
    timezone: input.timezone,
    defaultCurrency: input.defaultCurrency,
  };

  const existing = await prisma.organizationSettings.findUnique({ where: { id: ORGANIZATION_SETTINGS_ID } });
  const changedFields = organizationSettingsFields.filter(
    (field) => String(existing?.[field] ?? "") !== String(data[field] ?? "")
  );

  await prisma.organizationSettings.upsert({
    where: { id: ORGANIZATION_SETTINGS_ID },
    create: { id: ORGANIZATION_SETTINGS_ID, ...data, updatedById: user.id },
    update: { ...data, updatedById: user.id },
  });

  if (changedFields.length > 0) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ORGANIZATION_SETTINGS_UPDATED",
        entity: "OrganizationSettings",
        entityId: ORGANIZATION_SETTINGS_ID,
        // Field NAMES only — never the contact values themselves.
        metadata: { fieldsChanged: changedFields },
      },
    });
  }

  revalidatePath("/admin/parametres");
  return { success: changedFields.length > 0 ? "Informations enregistrées." : "Aucune modification à enregistrer." };
}
