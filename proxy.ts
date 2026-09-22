import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, decryptSession } from "@/lib/auth/session";

/**
 * Optimistic check only (cookie presence + signature/expiry), run on every
 * request to /admin and /connexion. The secure check — does the session
 * still exist in the database, is the account's role still allowed in —
 * happens in lib/auth/dal.ts (requireAdminUser), close to the data, which
 * routes rejections through /api/session/clear so a cookie that looks
 * optimistically valid here but gets rejected there never lingers to cause
 * a redirect loop.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasOptimisticSession = Boolean(await decryptSession(token));
  const hasStaleCookie = Boolean(token) && !hasOptimisticSession;

  if (pathname.startsWith("/admin") && !hasOptimisticSession) {
    const response = NextResponse.redirect(new URL("/connexion", request.url));
    if (hasStaleCookie) response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  if (pathname === "/connexion" && hasOptimisticSession) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (pathname === "/connexion" && hasStaleCookie) {
    const response = NextResponse.next();
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/connexion"],
};
