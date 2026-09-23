"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { Role } from "@/lib/generated/prisma/enums";
import { requireAdminUser } from "@/lib/auth/dal";
import { hashPassword } from "@/lib/auth/password";
import { decryptSession, getSessionCookie } from "@/lib/auth/session";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";
import { canAssignRole, canManageTeam, canManageUserAccount } from "@/lib/settings/permissions";
import { parseCreateUserForm, parseResetPasswordForm, parseUpdateUserForm } from "@/lib/settings/team-schema";

export type TeamFormState =
  | {
      error?: string;
      success?: string;
      fieldErrors?: Record<string, string>;
      /** Non-secret values echoed back after a failed create so the form keeps them — never passwords. */
      values?: { name: string; email: string; role: string };
    }
  | undefined;

const PERMISSION_ERROR = "Vous n'avez pas les droits nécessaires pour cette action.";
const LAST_SUPER_ADMIN_ERROR = "Impossible : ce compte est le dernier super administrateur actif.";

class LastSuperAdminError extends Error {}

/**
 * Serializable so two concurrent demotions/deactivations can't both see
 * "another active SUPER_ADMIN still exists" and leave zero behind.
 */
async function withSuperAdminGuard<T>(
  targetId: string,
  losesSuperAdmin: boolean,
  run: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      if (losesSuperAdmin) {
        const others = await tx.user.count({
          where: { role: Role.SUPER_ADMIN, isActive: true, id: { not: targetId } },
        });
        if (others === 0) throw new LastSuperAdminError();
      }
      return run(tx);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

async function currentSessionId(): Promise<string | null> {
  const payload = await decryptSession(await getSessionCookie());
  return payload?.sessionId ?? null;
}

function revalidateTeam(id?: string) {
  revalidatePath("/admin/parametres");
  if (id) revalidatePath(`/admin/parametres/equipe/${id}`);
}

export async function createTeamMember(_prevState: TeamFormState, formData: FormData): Promise<TeamFormState> {
  const actor = await requireAdminUser();
  if (!canManageTeam(actor.role)) return { error: PERMISSION_ERROR };

  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
  };

  const parsed = parseCreateUserForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error), values };
  }

  const { name, email, role, password } = parsed.data;
  if (!canAssignRole(actor.role, role)) {
    return {
      error: "Seul un super administrateur peut créer un super administrateur.",
      fieldErrors: { role: "Rôle non autorisé." },
      values,
    };
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { error: "Un compte existe déjà avec cet e-mail.", fieldErrors: { email: "E-mail déjà utilisé." }, values };
  }

  const passwordHash = await hashPassword(password);
  const created = await prisma.user.create({ data: { name, email, role, passwordHash } });

  // Never the password, its hash, or the e-mail — the role is the only relevant fact.
  await prisma.auditLog.create({
    data: { userId: actor.id, action: "USER_CREATED", entity: "User", entityId: created.id, metadata: { role } },
  });

  revalidateTeam();
  return { success: `Compte créé pour ${name}.` };
}

export async function updateTeamMember(id: string, _prevState: TeamFormState, formData: FormData): Promise<TeamFormState> {
  const actor = await requireAdminUser();
  if (!canManageTeam(actor.role)) return { error: PERMISSION_ERROR };

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, role: true, isActive: true } });
  if (!target) return { error: "Utilisateur introuvable." };
  if (!canManageUserAccount(actor.role, target.role)) {
    return { error: "Seul un super administrateur peut modifier un super administrateur." };
  }

  const parsed = parseUpdateUserForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { name, role } = parsed.data;
  const roleChanged = role !== target.role;

  if (roleChanged && target.id === actor.id) {
    return { error: "Vous ne pouvez pas modifier votre propre rôle.", fieldErrors: { role: "Rôle verrouillé." } };
  }
  if (roleChanged && !canAssignRole(actor.role, role)) {
    return { error: "Seul un super administrateur peut attribuer ce rôle.", fieldErrors: { role: "Rôle non autorisé." } };
  }

  const fieldsChanged = [name !== (target.name ?? "") && "name", roleChanged && "role"].filter(Boolean) as string[];
  if (fieldsChanged.length === 0) return { success: "Aucune modification à enregistrer." };

  const losesSuperAdmin = roleChanged && target.role === Role.SUPER_ADMIN && target.isActive;

  try {
    await withSuperAdminGuard(id, losesSuperAdmin, async (tx) => {
      await tx.user.update({ where: { id }, data: { name, role } });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: "USER_UPDATED",
          entity: "User",
          entityId: id,
          metadata: roleChanged ? { fieldsChanged, previousRole: target.role, newRole: role } : { fieldsChanged },
        },
      });
    });
  } catch (error) {
    if (error instanceof LastSuperAdminError) return { error: LAST_SUPER_ADMIN_ERROR };
    throw error;
  }

  revalidateTeam(id);
  return { success: "Modifications enregistrées." };
}

/**
 * Soft (de)activation only — accounts are never deleted. Deactivating also
 * revokes every existing session; verifySession() additionally rejects an
 * inactive account in case a session slips through.
 */
export async function setTeamMemberActive(id: string, isActive: boolean): Promise<TeamFormState> {
  const actor = await requireAdminUser();
  if (!canManageTeam(actor.role)) return { error: PERMISSION_ERROR };

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, isActive: true } });
  if (!target) return { error: "Utilisateur introuvable." };
  if (!canManageUserAccount(actor.role, target.role)) {
    return { error: "Seul un super administrateur peut modifier un super administrateur." };
  }
  if (!isActive && target.id === actor.id) return { error: "Vous ne pouvez pas désactiver votre propre compte." };
  if (target.isActive === isActive) return { success: isActive ? "Ce compte est déjà actif." : "Ce compte est déjà désactivé." };

  const losesSuperAdmin = !isActive && target.role === Role.SUPER_ADMIN;

  try {
    await withSuperAdminGuard(id, losesSuperAdmin, async (tx) => {
      await tx.user.update({ where: { id }, data: { isActive, deactivatedAt: isActive ? null : new Date() } });
      const revoked = isActive ? { count: 0 } : await tx.session.deleteMany({ where: { userId: id } });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
          entity: "User",
          entityId: id,
          metadata: isActive ? {} : { sessionsRevoked: revoked.count },
        },
      });
    });
  } catch (error) {
    if (error instanceof LastSuperAdminError) return { error: LAST_SUPER_ADMIN_ERROR };
    throw error;
  }

  revalidateTeam(id);
  return { success: isActive ? "Compte réactivé." : "Compte désactivé — ses sessions ont été fermées." };
}

/**
 * Sets a new bcrypt-hashed password. The plain value is never stored or
 * logged. Every other session of the account is revoked (the actor's own
 * current session is kept when resetting their own password).
 */
export async function resetTeamMemberPassword(id: string, _prevState: TeamFormState, formData: FormData): Promise<TeamFormState> {
  const actor = await requireAdminUser();
  if (!canManageTeam(actor.role)) return { error: PERMISSION_ERROR };

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return { error: "Utilisateur introuvable." };
  if (!canManageUserAccount(actor.role, target.role)) {
    return { error: "Seul un super administrateur peut modifier un super administrateur." };
  }

  const parsed = parseResetPasswordForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const keepSessionId = target.id === actor.id ? await currentSessionId() : null;

  const revoked = await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { passwordHash } });
    const deleted = await tx.session.deleteMany({
      where: { userId: id, ...(keepSessionId ? { id: { not: keepSessionId } } : {}) },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "USER_PASSWORD_RESET",
        entity: "User",
        entityId: id,
        metadata: { sessionsRevoked: deleted.count },
      },
    });
    return deleted.count;
  });

  revalidateTeam(id);
  return { success: revoked > 0 ? `Mot de passe mis à jour — ${revoked} session(s) fermée(s).` : "Mot de passe mis à jour." };
}
