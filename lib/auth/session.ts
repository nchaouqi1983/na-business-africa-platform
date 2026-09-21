import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "na_admin_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function getEncodedKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Copy .env.example to .env and generate one with `openssl rand -base64 32`."
    );
  }
  return new TextEncoder().encode(secret);
}

type SessionPayload = {
  sessionId: string;
};

/**
 * The JWT only carries the DB session id — never the user's role or other
 * data — so authorization always resolves against the live Session/User
 * rows (see lib/auth/dal.ts) instead of trusting a value baked into the
 * cookie at login time.
 */
export async function encryptSession(sessionId: string, expiresAt: Date) {
  return new SignJWT({ sessionId } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getEncodedKey());
}

export async function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload.sessionId ? { sessionId: payload.sessionId } : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(sessionId: string, expiresAt: Date) {
  const token = await encryptSession(sessionId, expiresAt);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
