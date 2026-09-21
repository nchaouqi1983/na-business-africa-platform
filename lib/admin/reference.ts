import "server-only";
import { prisma } from "@/lib/db";

/**
 * Atomically allocates the next sequence number for the current year and
 * returns a reference formatted as NHA-YYYY-000001.
 *
 * Deliberately NOT based on `count()` of existing properties: two concurrent
 * creations could read the same count and mint the same reference. Instead a
 * single `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` statement is used —
 * Postgres serializes concurrent writers on that row, so each caller gets a
 * distinct, gapless-per-request sequence value.
 */
export async function generateNextPropertyReference(): Promise<string> {
  const year = new Date().getFullYear();

  const rows = await prisma.$queryRaw<{ seq: number }[]>`
    INSERT INTO "PropertyReferenceCounter" ("year", "seq")
    VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE SET "seq" = "PropertyReferenceCounter"."seq" + 1
    RETURNING "seq"
  `;

  const seq = rows[0].seq;
  return `NHA-${year}-${String(seq).padStart(6, "0")}`;
}
