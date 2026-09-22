"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import { parseOwnerForm, type OwnerFormInput } from "@/lib/real-estate-network/owner-schema";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";

export type OwnerFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
      owner?: { id: string; fullNameOrCompany: string };
    }
  | undefined;

/**
 * Field names that changed, never their values — the diff feeds AuditLog,
 * which must never carry phone/email/CIN/ICE/address/notes (personal data).
 */
function diffOwnerFields(
  existing: { [K in keyof OwnerFormInput]?: OwnerFormInput[K] | null } | null,
  next: OwnerFormInput
): string[] {
  const fields = Object.keys(next) as (keyof OwnerFormInput)[];
  return fields.filter((field) => String(existing?.[field] ?? "") !== String(next[field] ?? ""));
}

async function performCreateOwner(formData: FormData): Promise<
  | { ok: false; state: OwnerFormState }
  | { ok: true; owner: { id: string; fullNameOrCompany: string } }
> {
  const user = await requireAdminUser();
  if (!canManageRealEstateNetwork(user.role)) {
    return { ok: false, state: { error: "Vous n'avez pas le droit de créer un propriétaire." } };
  }

  const parsed = parseOwnerForm(formData);
  if (!parsed.success) {
    return { ok: false, state: { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) } };
  }

  const owner = await prisma.owner.create({ data: parsed.data });

  // Never log fullNameOrCompany, phone, email, CIN/ICE, address or notes.
  await prisma.auditLog.create({
    data: { userId: user.id, action: "OWNER_CREATED", entity: "Owner", entityId: owner.id, metadata: { kind: owner.kind } },
  });

  revalidatePath("/admin/proprietaires");
  return { ok: true, owner: { id: owner.id, fullNameOrCompany: owner.fullNameOrCompany } };
}

/** Full "Nouveau propriétaire" page — redirects to the detail screen on success. */
export async function createOwner(_prevState: OwnerFormState, formData: FormData): Promise<OwnerFormState> {
  const result = await performCreateOwner(formData);
  if (!result.ok) return result.state;
  redirect(`/admin/proprietaires/${result.owner.id}`);
}

/** Inline quick-create from a property's Relations picker — never redirects. */
export async function createOwnerQuick(_prevState: OwnerFormState, formData: FormData): Promise<OwnerFormState> {
  const result = await performCreateOwner(formData);
  return result.ok ? { owner: result.owner } : result.state;
}

export async function updateOwner(id: string, _prevState: OwnerFormState, formData: FormData): Promise<OwnerFormState> {
  const user = await requireAdminUser();
  if (!canManageRealEstateNetwork(user.role)) {
    return { error: "Vous n'avez pas le droit de modifier ce propriétaire." };
  }

  const existing = await prisma.owner.findUnique({ where: { id } });
  if (!existing) return { error: "Propriétaire introuvable." };

  const parsed = parseOwnerForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  const changedFields = diffOwnerFields(existing, parsed.data);

  await prisma.owner.update({ where: { id }, data: parsed.data });

  if (changedFields.length > 0) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "OWNER_UPDATED",
        entity: "Owner",
        entityId: id,
        // Field NAMES only — never the phone/email/CIN/ICE/address/notes values.
        metadata: { fieldsChanged: changedFields },
      },
    });
  }

  revalidatePath(`/admin/proprietaires/${id}`);
  revalidatePath("/admin/proprietaires");
  redirect(`/admin/proprietaires/${id}`);
}

export async function setOwnerActive(id: string, isActive: boolean): Promise<void> {
  const user = await requireAdminUser();
  if (!canManageRealEstateNetwork(user.role)) {
    redirect(`/admin/proprietaires/${id}?erreur=permission`);
  }

  const owner = await prisma.owner.findUnique({ where: { id } });
  if (!owner) redirect("/admin/proprietaires");

  await prisma.owner.update({ where: { id }, data: { isActive } });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: isActive ? "OWNER_ACTIVATED" : "OWNER_DEACTIVATED",
      entity: "Owner",
      entityId: id,
      metadata: {},
    },
  });

  revalidatePath(`/admin/proprietaires/${id}`);
  revalidatePath("/admin/proprietaires");
  redirect(`/admin/proprietaires/${id}`);
}
