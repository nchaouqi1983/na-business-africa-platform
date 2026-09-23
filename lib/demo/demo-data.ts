import "server-only";
import { prisma } from "@/lib/db";
import { DEMO_ID_PREFIX } from "@/lib/demo/constants";

/**
 * True when the local DEMO_NA dataset (prisma/demo/) is loaded — drives the
 * discreet admin-only banner in app/admin/layout.tsx. Never called from the
 * public site.
 */
export async function hasDemoData(): Promise<boolean> {
  const row = await prisma.property.findFirst({ where: { id: { startsWith: DEMO_ID_PREFIX } }, select: { id: true } });
  if (row) return true;
  const prospect = await prisma.prospect.findFirst({ where: { id: { startsWith: DEMO_ID_PREFIX } }, select: { id: true } });
  return prospect !== null;
}
