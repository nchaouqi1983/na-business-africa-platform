import "server-only";
import { promises as dns } from "node:dns";
import net from "node:net";

/**
 * Secure fetch for `image_urls` (phase 6J2). Every request is gated by an
 * operator-configured host allow-list (PROPERTY_IMPORT_IMAGE_HOSTS) — never
 * an arbitrary URL — plus several independent SSRF mitigations: HTTPS only,
 * manual (never-followed) redirects, a private/loopback/link-local IP check
 * on the resolved address before connecting, and a hard byte cap enforced
 * while streaming (never trusting Content-Length alone). Magic-byte format
 * checking happens one layer up in lib/media/image-processing.ts, reusing
 * the exact same pipeline as a manual media upload.
 */

const FETCH_TIMEOUT_MS = 15_000;

export type ImageFetchResult = { ok: true; buffer: Buffer } | { ok: false; reason: string };

function allowedHosts(): Set<string> {
  const raw = process.env.PROPERTY_IMPORT_IMAGE_HOSTS ?? "";
  return new Set(
    raw
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
  );
}

function isDisallowedIp(address: string): boolean {
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }
  if (net.isIPv6(address)) {
    const lower = address.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
    return false;
  }
  return true; // Unrecognized address shape — fail closed.
}

/** Cheap, synchronous checks (scheme + host allow-list) — safe to run at CSV validation time, no network call. */
export function checkImageUrlSyntax(rawUrl: string): { ok: true; hostname: string } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "URL invalide" };
  }
  if (url.protocol !== "https:") {
    return { ok: false, reason: "seul HTTPS est autorisé" };
  }
  const hosts = allowedHosts();
  if (hosts.size === 0 || !hosts.has(url.hostname.toLowerCase())) {
    return { ok: false, reason: `hôte non autorisé (${url.hostname})` };
  }
  return { ok: true, hostname: url.hostname };
}

/** Downloads the URL's body, capped at maxBytes, after re-checking syntax, DNS-resolved IP range, and refusing any redirect. */
export async function fetchImageBytes(rawUrl: string, maxBytes: number): Promise<ImageFetchResult> {
  const syntax = checkImageUrlSyntax(rawUrl);
  if (!syntax.ok) return { ok: false, reason: syntax.reason };

  try {
    const addresses = await dns.lookup(syntax.hostname, { all: true });
    if (addresses.length === 0 || addresses.some((entry) => isDisallowedIp(entry.address))) {
      return { ok: false, reason: "adresse IP résolue non autorisée" };
    }
  } catch {
    return { ok: false, reason: "résolution DNS impossible" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(rawUrl, { redirect: "manual", signal: controller.signal });
  } catch {
    return { ok: false, reason: "téléchargement impossible (réseau ou délai dépassé)" };
  } finally {
    clearTimeout(timeout);
  }

  if (response.status >= 300 && response.status < 400) {
    return { ok: false, reason: "redirection refusée" };
  }
  if (!response.ok) {
    return { ok: false, reason: `réponse HTTP ${response.status}` };
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    return { ok: false, reason: "image trop volumineuse" };
  }
  if (!response.body) {
    return { ok: false, reason: "réponse vide" };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return { ok: false, reason: "image trop volumineuse" };
    }
    chunks.push(value);
  }

  return { ok: true, buffer: Buffer.concat(chunks) };
}
