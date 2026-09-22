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
 *
 * Rejections go through /api/session/clear rather than straight to
 * /connexion so the (now-invalid) session cookie gets cleared. Without that,
 * a cookie that still decrypts fine (valid JWT signature/expiry) but whose
 * DB session was deleted/expired/denied keeps looking "optimistically valid"
 * to proxy.ts, which then bounces /connexion back to /admin — an infinite
 * redirect loop. Cookie mutation isn't allowed in this Server Component
 * render, hence the redirect to a Route Handler that can clear it.
 */
export async function requireAdminUser(): Promise<AuthenticatedUser> {
  const user = await verifySession();

  if (!user) {
    redirect("/api/session/clear");
  }

  if (!isAdminAccessible(user.role)) {
    redirect("/api/session/clear?erreur=role");
  }

  return user;
}
