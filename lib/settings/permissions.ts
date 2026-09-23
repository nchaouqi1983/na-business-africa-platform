import { Role } from "@/lib/generated/prisma/enums";

/**
 * Central, server-only permission rules for /admin/parametres (phase 6M).
 * Mirrors lib/property-permissions.ts: every Server Action must call these
 * helpers itself — the admin UI only uses them to decide what to render,
 * never to enforce access.
 *
 * - Every admin-accessible role may open the page and read the agency
 *   information and the référentiels.
 * - Only SUPER_ADMIN / ADMIN may edit the agency information or see and
 *   manage the team.
 * - A SUPER_ADMIN account (and the SUPER_ADMIN role itself) can only be
 *   touched by another SUPER_ADMIN.
 */

export function canEditOrganizationSettings(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN;
}

export function canManageTeam(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN;
}

/** Whether `actorRole` may edit, (de)activate or reset the password of an account currently holding `targetRole`. */
export function canManageUserAccount(actorRole: Role, targetRole: Role): boolean {
  if (!canManageTeam(actorRole)) return false;
  if (targetRole === Role.SUPER_ADMIN) return actorRole === Role.SUPER_ADMIN;
  return true;
}

/** Whether `actorRole` may give an account the role `role` (on creation or update). */
export function canAssignRole(actorRole: Role, role: Role): boolean {
  if (!canManageTeam(actorRole)) return false;
  if (role === Role.SUPER_ADMIN) return actorRole === Role.SUPER_ADMIN;
  return true;
}
