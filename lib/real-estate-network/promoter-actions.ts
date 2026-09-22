"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import { parsePromoterForm, type PromoterFormInput } from "@/lib/real-estate-network/promoter-schema";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";

export type PromoterFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
      promoter?: { id: string; companyName: string };
    }
  | undefined;

function diffPromoterFields(
  existing: { [K in keyof PromoterFormInput]?: PromoterFormInput[K] | null } | null,
  next: PromoterFormInput
): string[] {
  const fields = Object.keys(next) as (keyof PromoterFormInput)[];
  return fields.filter((field) => String(existing?.[field] ?? "") !== String(next[field] ?? ""));
}

async function performCreatePromoter(formData: FormData): Promise<
  { ok: false; state: PromoterFormState } | { ok: true; promoter: { id: string; companyName: string } }
> {
  const user = await requireAdminUser();
  if (!canManageRealEstateNetwork(user.role)) {
    return { ok: false, state: { error: "Vous n'avez pas le droit de créer un promoteur." } };
  }

  const parsed = parsePromoterForm(formData);
  if (!parsed.success) {
    return { ok: false, state: { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) } };
  }

  const promoter = await prisma.promoter.create({ data: parsed.data });

  // Never log companyName, contact name, phone, email, website, ICE, address or notes.
  await prisma.auditLog.create({
    data: { userId: user.id, action: "PROMOTER_CREATED", entity: "Promoter", entityId: promoter.id, metadata: {} },
  });

  revalidatePath("/admin/promoteurs");
  return { ok: true, promoter: { id: promoter.id, companyName: promoter.companyName } };
}

/** Inline quick-create (list page panel or program form) — never redirects. */
export async function createPromoter(_prevState: PromoterFormState, formData: FormData): Promise<PromoterFormState> {
  const result = await performCreatePromoter(formData);
  return result.ok ? { promoter: result.promoter } : result.state;
}

export async function updatePromoter(id: string, _prevState: PromoterFormState, formData: FormData): Promise<PromoterFormState> {
  const user = await requireAdminUser();
  if (!canManageRealEstateNetwork(user.role)) {
    return { error: "Vous n'avez pas le droit de modifier ce promoteur." };
  }

  const existing = await prisma.promoter.findUnique({ where: { id } });
  if (!existing) return { error: "Promoteur introuvable." };

  const parsed = parsePromoterForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  const changedFields = diffPromoterFields(existing, parsed.data);

  await prisma.promoter.update({ where: { id }, data: parsed.data });

  if (changedFields.length > 0) {
    await prisma.auditLog.create({
      data: { userId: user.id, action: "PROMOTER_UPDATED", entity: "Promoter", entityId: id, metadata: { fieldsChanged: changedFields } },
    });
  }

  revalidatePath(`/admin/promoteurs/${id}`);
  revalidatePath("/admin/promoteurs");
  redirect(`/admin/promoteurs/${id}`);
}

export async function setPromoterActive(id: string, isActive: boolean): Promise<void> {
  const user = await requireAdminUser();
  if (!canManageRealEstateNetwork(user.role)) {
    redirect(`/admin/promoteurs/${id}?erreur=permission`);
  }

  const promoter = await prisma.promoter.findUnique({ where: { id } });
  if (!promoter) redirect("/admin/promoteurs");

  await prisma.promoter.update({ where: { id }, data: { isActive } });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: isActive ? "PROMOTER_ACTIVATED" : "PROMOTER_DEACTIVATED",
      entity: "Promoter",
      entityId: id,
      metadata: {},
    },
  });

  revalidatePath(`/admin/promoteurs/${id}`);
  revalidatePath("/admin/promoteurs");
  redirect(`/admin/promoteurs/${id}`);
}
