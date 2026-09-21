import { Role } from "@/lib/generated/prisma/client";

export { Role };

/**
 * Every role defined for the back office can open the authenticated /admin
 * shell in this phase. Per-role restrictions on specific pages/actions are
 * introduced alongside the modules that need them (property management,
 * commissions, etc.) — there is no non-staff role in the User table yet.
 */
export const ADMIN_ACCESSIBLE_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.AGENT,
  Role.EDITOR,
  Role.VIEWER,
];

export function isAdminAccessible(role: Role): boolean {
  return ADMIN_ACCESSIBLE_ROLES.includes(role);
}

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  AGENT: "Agent",
  EDITOR: "Éditeur",
  VIEWER: "Lecture seule",
};
