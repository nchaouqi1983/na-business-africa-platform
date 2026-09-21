import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { decryptSession, getSessionCookie } from "@/lib/auth/session";
import { isAdminAccessible, type Role } from "@/lib/auth/roles";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

/**
 * Secure check: resolves the session against the live Session/User rows in
 * the database rather than trusting the (optimistic) proxy check alone.
 * Memoized per request with React's cache().
 */
export const verifySession = cache(async (): Promise<AuthenticatedUser | null> => {
  const token = await getSessionCookie();
  const payload = await decryptSession(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
});

/**
 * Use at the top of protected /admin layouts and pages. Redirects to
 * /connexion when there is no valid session, and refuses access when the
 * account's role isn't allowed into the back office.
 */
export async function requireAdminUser(): Promise<AuthenticatedUser> {
  const user = await verifySession();

  if (!user) {
    redirect("/connexion");
  }

  if (!isAdminAccessible(user.role)) {
    redirect("/connexion?erreur=role");
  }

  return user;
}
