"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import { parseProgramForm, type ProgramFormInput } from "@/lib/real-estate-network/program-schema";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";

export type ProgramFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
      program?: { id: string; name: string };
    }
  | undefined;

function diffProgramFields(
  existing: { [K in keyof ProgramFormInput]?: ProgramFormInput[K] | null } | null,
  next: ProgramFormInput
): string[] {
  const fields = Object.keys(next) as (keyof ProgramFormInput)[];
  return fields.filter((field) => String(existing?.[field] ?? "") !== String(next[field] ?? ""));
}

async function performCreateProgram(formData: FormData): Promise<
  { ok: false; state: ProgramFormState } | { ok: true; program: { id: string; name: string } }
> {
  const user = await requireAdminUser();
  if (!canManageRealEstateNetwork(user.role)) {
    return { ok: false, state: { error: "Vous n'avez pas le droit de créer un programme." } };
  }

  const parsed = parseProgramForm(formData);
  if (!parsed.success) {
    return { ok: false, state: { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) } };
  }

  const promoter = await prisma.promoter.findUnique({ where: { id: parsed.data.promoterId } });
  if (!promoter) {
    return { ok: false, state: { error: "Promoteur introuvable.", fieldErrors: { promoterId: "Promoteur introuvable." } } };
  }

  const program = await prisma.developmentProgram.create({
    data: {
      ...parsed.data,
      expectedDeliveryDate: parsed.data.expectedDeliveryDate ? new Date(parsed.data.expectedDeliveryDate) : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PROGRAM_CREATED",
      entity: "DevelopmentProgram",
      entityId: program.id,
      metadata: { promoterId: program.promoterId, status: program.status },
    },
  });

  revalidatePath("/admin/programmes");
  return { ok: true, program: { id: program.id, name: program.name } };
}

/** Inline quick-create from the list page panel — never redirects. */
export async function createProgram(_prevState: ProgramFormState, formData: FormData): Promise<ProgramFormState> {
  const result = await performCreateProgram(formData);
  return result.ok ? { program: result.program } : result.state;
}

export async function updateProgram(id: string, _prevState: ProgramFormState, formData: FormData): Promise<ProgramFormState> {
  const user = await requireAdminUser();
  if (!canManageRealEstateNetwork(user.role)) {
    return { error: "Vous n'avez pas le droit de modifier ce programme." };
  }

  const existing = await prisma.developmentProgram.findUnique({ where: { id } });
  if (!existing) return { error: "Programme introuvable." };

  const parsed = parseProgramForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  const promoter = await prisma.promoter.findUnique({ where: { id: parsed.data.promoterId } });
  if (!promoter) {
    return { error: "Promoteur introuvable.", fieldErrors: { promoterId: "Promoteur introuvable." } };
  }

  const changedFields = diffProgramFields(
    { ...existing, expectedDeliveryDate: existing.expectedDeliveryDate?.toISOString().slice(0, 10) ?? null },
    parsed.data
  );

  await prisma.developmentProgram.update({
    where: { id },
    data: {
      ...parsed.data,
      expectedDeliveryDate: parsed.data.expectedDeliveryDate ? new Date(parsed.data.expectedDeliveryDate) : null,
    },
  });

  if (changedFields.length > 0) {
    await prisma.auditLog.create({
      data: { userId: user.id, action: "PROGRAM_UPDATED", entity: "DevelopmentProgram", entityId: id, metadata: { fieldsChanged: changedFields } },
    });
  }

  revalidatePath(`/admin/programmes/${id}`);
  revalidatePath("/admin/programmes");
  redirect(`/admin/programmes/${id}`);
}

export async function setProgramActive(id: string, isActive: boolean): Promise<void> {
  const user = await requireAdminUser();
  if (!canManageRealEstateNetwork(user.role)) {
    redirect(`/admin/programmes/${id}?erreur=permission`);
  }

  const program = await prisma.developmentProgram.findUnique({ where: { id } });
  if (!program) redirect("/admin/programmes");

  await prisma.developmentProgram.update({ where: { id }, data: { isActive } });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: isActive ? "PROGRAM_ACTIVATED" : "PROGRAM_DEACTIVATED",
      entity: "DevelopmentProgram",
      entityId: id,
      metadata: {},
    },
  });

  revalidatePath(`/admin/programmes/${id}`);
  revalidatePath("/admin/programmes");
  redirect(`/admin/programmes/${id}`);
}
