import { Role } from "@/lib/generated/prisma/enums";

/**
 * Central, server-only permission rule for the mandates/commissions module
 * (phase 6F). Mirrors lib/real-estate-network/permissions.ts: every Server
 * Action and query that touches this data must call this helper itself —
 * the admin UI only uses it to decide what to render, never to enforce
 * access. AGENT/EDITOR/VIEWER get zero access in this phase, including via
 * direct URL.
 */
export function canManageFinance(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN;
}
