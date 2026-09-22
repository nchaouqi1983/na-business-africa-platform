import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clearSessionCookie, decryptSession, getSessionCookie } from "@/lib/auth/session";

/**
 * Invalidates whatever session the request's cookie points to (if any) and
 * clears the cookie itself, then redirects to /connexion.
 *
 * requireAdminUser() (lib/auth/dal.ts) sends here instead of redirecting to
 * /connexion directly whenever it rejects a session — e.g. the DB row was
 * deleted or expired while the JWT cookie was still signature-valid. Cookie
 * mutation is only allowed in a Server Action or Route Handler, never in the
 * Server Component render that calls requireAdminUser(), hence the redirect
 * through this route. Clearing the cookie here is what stops proxy.ts from
 * bouncing /connexion back to /admin on the next request, which is what
 * caused the ERR_TOO_MANY_REDIRECTS loop.
 */
export async function GET(request: NextRequest) {
  const token = await getSessionCookie();
  const payload = await decryptSession(token);

  if (payload) {
    await prisma.session.delete({ where: { id: payload.sessionId } }).catch(() => null);
  }

  await clearSessionCookie();

  const destination = request.nextUrl.searchParams.get("erreur") === "role" ? "/connexion?erreur=role" : "/connexion";
  return NextResponse.redirect(new URL(destination, request.url));
}
