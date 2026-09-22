import "server-only";
import { prisma } from "@/lib/db";

/**
 * Atomically allocates the next sequence number for the current year and
 * returns a reference formatted as PRO-YYYY-000001. Same
 * INSERT ... ON CONFLICT ... RETURNING pattern as
 * lib/admin/reference.ts#generateNextPropertyReference — never a count() of
 * existing rows, which would race under concurrent creations.
 */
export async function generateNextProspectReference(): Promise<string> {
  const year = new Date().getFullYear();

  const rows = await prisma.$queryRaw<{ seq: number }[]>`
    INSERT INTO "ProspectReferenceCounter" ("year", "seq")
    VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE SET "seq" = "ProspectReferenceCounter"."seq" + 1
    RETURNING "seq"
  `;

  const seq = rows[0].seq;
  return `PRO-${year}-${String(seq).padStart(6, "0")}`;
}

/** Same pattern as generateNextProspectReference, for VIS-YYYY-000001 visit references. */
export async function generateNextVisitReference(): Promise<string> {
  const year = new Date().getFullYear();

  const rows = await prisma.$queryRaw<{ seq: number }[]>`
    INSERT INTO "VisitReferenceCounter" ("year", "seq")
    VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE SET "seq" = "VisitReferenceCounter"."seq" + 1
    RETURNING "seq"
  `;

  const seq = rows[0].seq;
  return `VIS-${year}-${String(seq).padStart(6, "0")}`;
}
