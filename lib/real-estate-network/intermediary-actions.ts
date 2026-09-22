"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import { parseIntermediaryForm, type IntermediaryFormInput } from "@/lib/real-estate-network/intermediary-schema";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";

export type IntermediaryFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
      intermediary?: { id: string; nameOrCompany: string };
    }
  | undefined;

function diffIntermediaryFields(
  existing: { [K in keyof IntermediaryFormInput]?: IntermediaryFormInput[K] | null } | null,
  next: IntermediaryFormInput
): string[] {
  const fields = Object.keys(next) as (keyof IntermediaryFormInput)[];
  return fields.filter((field) => String(existing?.[field] ?? "") !== String(next[field] ?? ""));
}

async function performCreateIntermediary(formData: FormData): Promise<
  { ok: false; state: IntermediaryFormState } | { ok: true; intermediary: { id: string; nameOrCompany: string } }
> {
  const user = await requireAdminUser();
  if (!canManageRealEstateNetwork(user.role)) {
    return { ok: false, state: { error: "Vous n'avez pas le droit de créer un intermédiaire." } };
  }

  const parsed = parseIntermediaryForm(formData);
  if (!parsed.success) {
    return { ok: false, state: { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) } };
  }

  const intermediary = await prisma.intermediary.create({ data: parsed.data });

  // Never log nameOrCompany, phone, email or notes.
  await prisma.auditLog.create({
    data: { userId: user.id, action: "INTERMEDIARY_CREATED", entity: "Intermediary", entityId: intermediary.id, metadata: { kind: intermediary.kind, type: intermediary.type } },
  });

  revalidatePath("/admin/intermediaires");
  return { ok: true, intermediary: { id: intermediary.id, nameOrCompany: intermediary.nameOrCompany } };
}

/** Inline quick-create from the list page panel or a property's Relations picker — never redirects. */
export async function createIntermediary(_prevState: IntermediaryFormState, formData: FormData): Promise<IntermediaryFormState> {
  const result = await performCreateIntermediary(formData);
  return result.ok ? { intermediary: result.intermediary } : result.state;
}

export async function updateIntermediary(
  id: string,
  _prevState: IntermediaryFormState,
  formData: FormData
): Promise<IntermediaryFormState> {
  const user = await requireAdminUser();
  if (!canManageRealEstateNetwork(user.role)) {
    return { error: "Vous n'avez pas le droit de modifier cet intermédiaire." };
  }

  const existing = await prisma.intermediary.findUnique({ where: { id } });
  if (!existing) return { error: "Intermédiaire introuvable." };

  const parsed = parseIntermediaryForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  const changedFields = diffIntermediaryFields(existing, parsed.data);

  await prisma.intermediary.update({ where: { id }, data: parsed.data });

  if (changedFields.length > 0) {
    await prisma.auditLog.create({
      data: { userId: user.id, action: "INTERMEDIARY_UPDATED", entity: "Intermediary", entityId: id, metadata: { fieldsChanged: changedFields } },
    });
  }

  revalidatePath(`/admin/intermediaires/${id}`);
  revalidatePath("/admin/intermediaires");
  redirect(`/admin/intermediaires/${id}`);
}

export async function setIntermediaryActive(id: string, isActive: boolean): Promise<void> {
  const user = await requireAdminUser();
  if (!canManageRealEstateNetwork(user.role)) {
    redirect(`/admin/intermediaires/${id}?erreur=permission`);
  }

  const intermediary = await prisma.intermediary.findUnique({ where: { id } });
  if (!intermediary) redirect("/admin/intermediaires");

  await prisma.intermediary.update({ where: { id }, data: { isActive } });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: isActive ? "INTERMEDIARY_ACTIVATED" : "INTERMEDIARY_DEACTIVATED",
      entity: "Intermediary",
      entityId: id,
      metadata: {},
    },
  });

  revalidatePath(`/admin/intermediaires/${id}`);
  revalidatePath("/admin/intermediaires");
  redirect(`/admin/intermediaires/${id}`);
}
