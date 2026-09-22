import { Role } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Central, server-only permission rules for the operational CRM module
 * (prospects, visits, activities/follow-ups — phase 6G1). Mirrors
 * lib/property-permissions.ts / lib/finance/permissions.ts: every Server
 * Action and query that touches this data must call these helpers itself —
 * the admin UI only uses them to decide what to render, never to enforce
 * access.
 *
 * Rules (see AGENTS.md / the 6G1 brief for the exact wording):
 * - SUPER_ADMIN / ADMIN: full access to every prospect/visit/activity.
 * - AGENT: only rows it created or is assignedTo, for all three entities.
 *   No access at all — including read, including direct URL — to another
 *   agent's prospects.
 * - EDITOR: read-only on rows assignedTo it; may edit a Visit or Activity
 *   assignedTo it, but never a Prospect record itself.
 * - VIEWER: read-only on rows assignedTo it, no edit rights anywhere.
 */

/**
 * createdById is nullable only on Prospect (a public /contact, /vendre or
 * /off-market submission has no back-office user behind it — see
 * lib/crm/public-request-actions.ts). Visit/Activity keep a required
 * createdById; widening the shared type here just lets a null Prospect row
 * flow through the same helpers without a mismatch.
 */
export type Ownership = { createdById: string | null; assignedToId: string | null };

export function canCreateProspect(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN || role === Role.AGENT;
}

export function canViewProspect(role: Role, userId: string, prospect: Ownership): boolean {
  switch (role) {
    case Role.SUPER_ADMIN:
    case Role.ADMIN:
      return true;
    case Role.AGENT:
      return prospect.createdById === userId || prospect.assignedToId === userId;
    case Role.EDITOR:
    case Role.VIEWER:
      return prospect.assignedToId === userId;
    default:
      return false;
  }
}

/** EDITOR/VIEWER never edit a Prospect record itself, even when it is assignedTo them. */
export function canEditProspect(role: Role, userId: string, prospect: Ownership): boolean {
  switch (role) {
    case Role.SUPER_ADMIN:
    case Role.ADMIN:
      return true;
    case Role.AGENT:
      return prospect.createdById === userId || prospect.assignedToId === userId;
    default:
      return false;
  }
}

export function canCreateVisit(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN || role === Role.AGENT;
}

export function canViewVisit(role: Role, userId: string, visit: Ownership): boolean {
  switch (role) {
    case Role.SUPER_ADMIN:
    case Role.ADMIN:
      return true;
    case Role.AGENT:
      return visit.createdById === userId || visit.assignedToId === userId;
    case Role.EDITOR:
    case Role.VIEWER:
      return visit.assignedToId === userId;
    default:
      return false;
  }
}

export function canEditVisit(role: Role, userId: string, visit: Ownership): boolean {
  switch (role) {
    case Role.SUPER_ADMIN:
    case Role.ADMIN:
      return true;
    case Role.AGENT:
      return visit.createdById === userId || visit.assignedToId === userId;
    case Role.EDITOR:
      return visit.assignedToId === userId;
    default:
      return false;
  }
}

export function canCreateActivity(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN || role === Role.AGENT;
}

export function canViewActivity(role: Role, userId: string, activity: Ownership): boolean {
  switch (role) {
    case Role.SUPER_ADMIN:
    case Role.ADMIN:
      return true;
    case Role.AGENT:
      return activity.createdById === userId || activity.assignedToId === userId;
    case Role.EDITOR:
    case Role.VIEWER:
      return activity.assignedToId === userId;
    default:
      return false;
  }
}

export function canEditActivity(role: Role, userId: string, activity: Ownership): boolean {
  switch (role) {
    case Role.SUPER_ADMIN:
    case Role.ADMIN:
      return true;
    case Role.AGENT:
      return activity.createdById === userId || activity.assignedToId === userId;
    case Role.EDITOR:
      return activity.assignedToId === userId;
    default:
      return false;
  }
}

type OwnershipWhere = { createdById?: string; assignedToId?: string | null; OR?: OwnershipWhere[] };

/**
 * Row-level `where` scoping for list queries — `undefined` means "no extra
 * filter" (SUPER_ADMIN/ADMIN see everything). Applied identically to
 * Prospect/Visit/Activity list queries since the three models share the same
 * createdById/assignedToId ownership shape.
 */
function ownershipWhere(role: Role, userId: string): OwnershipWhere | undefined {
  if (role === Role.SUPER_ADMIN || role === Role.ADMIN) return undefined;
  if (role === Role.AGENT) return { OR: [{ createdById: userId }, { assignedToId: userId }] };
  return { assignedToId: userId };
}

export function prospectAccessWhere(role: Role, userId: string): Prisma.ProspectWhereInput | undefined {
  return ownershipWhere(role, userId);
}

export function visitAccessWhere(role: Role, userId: string): Prisma.VisitWhereInput | undefined {
  return ownershipWhere(role, userId);
}

export function activityAccessWhere(role: Role, userId: string): Prisma.ActivityWhereInput | undefined {
  return ownershipWhere(role, userId);
}
