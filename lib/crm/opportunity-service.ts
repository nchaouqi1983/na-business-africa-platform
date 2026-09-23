import "server-only";
import { prisma } from "@/lib/db";

/**
 * Bumps Opportunity.lastActivityAt — called whenever something happens on an
 * opportunity (linked activity/visit written, stage change, edit), so the
 * "sans activité depuis 7 jours" signal only flags genuinely dormant deals.
 * Deliberately NOT in a "use server" file: it must never be callable as a
 * Server Action from the client.
 */
export async function touchOpportunity(opportunityId: string | null | undefined): Promise<void> {
  if (!opportunityId) return;
  await prisma.opportunity.updateMany({ where: { id: opportunityId }, data: { lastActivityAt: new Date() } });
}
