import { Role } from "@/lib/generated/prisma/enums";

/**
 * Central, server-only permission rule for the CSV property import module
 * (phase 6J1). Mirrors lib/finance/permissions.ts: every Server Action and
 * query that touches an import batch/row must call this helper itself — the
 * admin UI only uses it to decide what to render, never to enforce access.
 * AGENT/EDITOR/VIEWER get zero access, including via direct URL.
 */
export function canManageImports(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN;
}
