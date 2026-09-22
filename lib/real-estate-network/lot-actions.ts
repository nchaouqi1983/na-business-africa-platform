"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageRealEstateNetwork } from "@/lib/real-estate-network/permissions";
import { parseLotForm, parseExtraInfoJson, type LotFormInput } from "@/lib/real-estate-network/lot-schema";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";

export type LotFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
      lot?: { id: string; reference: string };
    }
  | undefined;

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function diffLotFields(
  existing: { [K in keyof LotFormInput]?: LotFormInput[K] | null } | null,
  next: LotFormInput
): string[] {
  const fields = Object.keys(next) as (keyof LotFormInput)[];
  return fields.filter((field) => String(existing?.[field] ?? "") !== String(next[field] ?? ""));
}

export async function createLot(programId: string, _prevState: LotFormState, formData: FormData): Promise<LotFormState> {
  const user = await requireAdminUser();
  if (!canManageRealEstateNetwork(user.role)) {
    return { error: "Vous n'avez pas le droit de créer un lot." };
  }

  const program = await prisma.developmentProgram.findUnique({ where: { id: programId } });
  if (!program) return { error: "Programme introuvable." };

  const parsed = parseLotForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  const extraInfo = parseExtraInfoJson(parsed.data.extraInfo);
  if (!extraInfo.ok) {
    return { error: "Informations complémentaires : JSON invalide.", fieldErrors: { extraInfo: "JSON invalide." } };
  }

  try {
    const lot = await prisma.developmentLot.create({
      data: {
        programId,
        reference: parsed.data.reference,
        lotType: parsed.data.lotType,
        typology: parsed.data.typology,
        surface: parsed.data.surface,
        price: parsed.data.price,
        status: parsed.data.status,
        floor: parsed.data.floor,
        block: parsed.data.block,
        extraInfo: extraInfo.value as Prisma.InputJsonValue | undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOT_CREATED",
        entity: "DevelopmentLot",
        entityId: lot.id,
        metadata: { programId, status: lot.status },
      },
    });

    revalidatePath(`/admin/programmes/${programId}`);
    return { lot: { id: lot.id, reference: lot.reference } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Un lot avec cette référence existe déjà dans ce programme.", fieldErrors: { reference: "Référence déjà utilisée." } };
    }
    throw error;
  }
}

export async function updateLot(lotId: string, _prevState: LotFormState, formData: FormData): Promise<LotFormState> {
  const user = await requireAdminUser();
  if (!canManageRealEstateNetwork(user.role)) {
    return { error: "Vous n'avez pas le droit de modifier ce lot." };
  }

  const existing = await prisma.developmentLot.findUnique({ where: { id: lotId } });
  if (!existing) return { error: "Lot introuvable." };

  const parsed = parseLotForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  const extraInfo = parseExtraInfoJson(parsed.data.extraInfo);
  if (!extraInfo.ok) {
    return { error: "Informations complémentaires : JSON invalide.", fieldErrors: { extraInfo: "JSON invalide." } };
  }

  const changedFields = diffLotFields(
    {
      ...existing,
      surface: existing.surface ?? undefined,
      price: existing.price ? Number(existing.price) : undefined,
      extraInfo: existing.extraInfo ? JSON.stringify(existing.extraInfo) : undefined,
    },
    parsed.data
  );

  try {
    await prisma.developmentLot.update({
      where: { id: lotId },
      data: {
        reference: parsed.data.reference,
        lotType: parsed.data.lotType,
        typology: parsed.data.typology,
        surface: parsed.data.surface,
        price: parsed.data.price,
        status: parsed.data.status,
        floor: parsed.data.floor,
        block: parsed.data.block,
        extraInfo: extraInfo.value as Prisma.InputJsonValue | undefined,
      },
    });

    if (changedFields.length > 0) {
      await prisma.auditLog.create({
        data: { userId: user.id, action: "LOT_UPDATED", entity: "DevelopmentLot", entityId: lotId, metadata: { fieldsChanged: changedFields } },
      });
    }

    revalidatePath(`/admin/programmes/${existing.programId}`);
    return { lot: { id: lotId, reference: parsed.data.reference } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Un lot avec cette référence existe déjà dans ce programme.", fieldErrors: { reference: "Référence déjà utilisée." } };
    }
    throw error;
  }
}
