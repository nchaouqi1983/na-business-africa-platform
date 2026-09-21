import { Role, type PublicationStatus } from "@/lib/generated/prisma/enums";

/**
 * Central, server-only permission rules for the property registry.
 * Every Server Action must call these helpers itself — the admin UI only
 * uses them to decide what to render, never to enforce access.
 */

export type PropertyOwnership = {
  createdById: string;
  assignedToId: string | null;
  publicationStatus: PublicationStatus;
};

export function canCreateProperty(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN || role === Role.AGENT;
}

/**
 * AGENT: only its own or assigned properties, and only while still a draft —
 * once ADMIN/SUPER_ADMIN publishes or archives it, the agent loses edit
 * rights (they can never publish/archive themselves anyway).
 * EDITOR: only properties assigned to it, at any publication state (no
 * publication rights either way — see canPublishProperty/canArchiveProperty).
 */
export function canEditProperty(role: Role, userId: string, property: PropertyOwnership): boolean {
  switch (role) {
    case Role.SUPER_ADMIN:
    case Role.ADMIN:
      return true;
    case Role.AGENT: {
      const owns = property.createdById === userId || property.assignedToId === userId;
      return owns && property.publicationStatus === "BROUILLON";
    }
    case Role.EDITOR:
      return property.assignedToId === userId;
    default:
      return false;
  }
}

export function canPublishProperty(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN;
}

export function canArchiveProperty(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN;
}

export function canViewPrivateData(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN;
}

/** SUPER_ADMIN/ADMIN only — matches the "création de tag" rule in 6B2. */
export function canManageTags(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN;
}
