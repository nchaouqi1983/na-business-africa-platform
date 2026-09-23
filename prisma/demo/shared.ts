import "dotenv/config";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { DEMO_ID_PREFIX } from "../../lib/demo/constants";

export { DEMO_TAG, DEMO_ID_PREFIX, DEMO_EMAIL_DOMAIN } from "../../lib/demo/constants";

/** Same storage root as lib/media/storage.ts (not importable here: it starts with `import "server-only"`). */
export const MEDIA_STORAGE_ROOT = path.join(process.cwd(), "storage", "properties");

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "postgres", "db"]);

/**
 * Refuses to run against anything that doesn't look like the local dev
 * database — the demo dataset must never land in (or be cleared from) a
 * shared/production database by accident.
 */
export function assertLocalDatabase(): string {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusé : NODE_ENV=production. Les données de démonstration sont réservées à la base locale.");
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL n'est pas défini (voir .env.example).");

  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error("DATABASE_URL illisible.");
  }
  if (!LOCAL_HOSTS.has(host) && process.env.DEMO_ALLOW_NON_LOCAL_DB !== "1") {
    throw new Error(
      `Refusé : la base "${host}" n'est pas locale. Exportez DEMO_ALLOW_NON_LOCAL_DB=1 uniquement si vous êtes certain qu'il s'agit d'une base de démonstration.`
    );
  }
  return host;
}

export function createPrisma(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
}

/** Deterministic demo id, e.g. demoId("prop", 3) → "demona-prop-03". */
export function demoId(kind: string, n: number | string): string {
  const suffix = typeof n === "number" ? String(n).padStart(2, "0") : n;
  return `${DEMO_ID_PREFIX}${kind}-${suffix}`;
}

export const demoIdWhere = { startsWith: DEMO_ID_PREFIX };
