import "server-only";
import { prisma } from "@/lib/db";
import type { Role } from "@/lib/generated/prisma/enums";

export type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isActive: boolean;
  deactivatedAt: Date | null;
  createdAt: Date;
};

const teamMemberSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  deactivatedAt: true,
  createdAt: true,
} as const;

/** Callers must have checked canManageTeam() first — this returns every account's e-mail. */
export async function listTeamMembers(): Promise<TeamMember[]> {
  return prisma.user.findMany({
    select: teamMemberSelect,
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });
}

/** Callers must have checked canManageTeam() first. */
export async function getTeamMember(id: string): Promise<TeamMember | null> {
  return prisma.user.findUnique({ where: { id }, select: teamMemberSelect });
}

export async function countActiveSessions(userId: string): Promise<number> {
  return prisma.session.count({ where: { userId, expiresAt: { gt: new Date() } } });
}
