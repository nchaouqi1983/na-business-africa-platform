import "server-only";

/**
 * Minimal anti-spam guard for the public /contact, /vendre and /off-market
 * Server Actions (phase 6G2). Two independent, best-effort signals — neither
 * requires new infrastructure:
 *
 * 1. A per-IP sliding-window counter, kept in memory.
 * 2. A minimum fill time, comparing the request's timestamp against a
 *    `formStartedAt` value the form captured on mount.
 *
 * Known limitation (documented, not silently assumed away): the in-memory
 * Map is per server process. It resets on every restart/deploy and is not
 * shared across instances behind a load balancer. That is an acceptable
 * trade-off for this phase (single local/Next instance, no Redis available)
 * but should move to a shared store (Redis, or a DB-backed counter like
 * lib/crm/reference.ts's atomic counters) before scaling out horizontally.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 8;
const MIN_FILL_TIME_MS = 1500;

const hitsByKey = new Map<string, number[]>();

function prune(now: number) {
  for (const [key, timestamps] of hitsByKey) {
    const kept = timestamps.filter((t) => now - t < WINDOW_MS);
    if (kept.length === 0) hitsByKey.delete(key);
    else hitsByKey.set(key, kept);
  }
}

/** Records one attempt for `key` (typically the caller's IP) and reports whether it is over the limit. */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  if (hitsByKey.size > 2000) prune(now);

  const timestamps = (hitsByKey.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  hitsByKey.set(key, timestamps);

  return timestamps.length > MAX_REQUESTS_PER_WINDOW;
}

/** True when the form was submitted implausibly fast for a human (or the timestamp is missing/malformed). */
export function isSubmittedTooFast(formStartedAt: string | null): boolean {
  const startedAt = Number(formStartedAt);
  if (!formStartedAt || !Number.isFinite(startedAt)) return true;
  return Date.now() - startedAt < MIN_FILL_TIME_MS;
}

/**
 * Best-effort caller IP from the standard proxy headers. Falls back to
 * "unknown" both when no header is present and when this runs outside a
 * real request context (e.g. a script) — headers() throws there, and a
 * shared "unknown" bucket is a safe, if coarse, fallback rather than a hard
 * crash.
 */
export async function getClientIp(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const list = await headers();
    const forwardedFor = list.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0].trim();
    return list.get("x-real-ip")?.trim() || "unknown";
  } catch {
    return "unknown";
  }
}
