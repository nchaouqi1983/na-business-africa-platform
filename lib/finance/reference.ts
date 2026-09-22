import "server-only";
import { prisma } from "@/lib/db";

/**
 * Atomically allocates the next sequence number for the current year and
 * returns a reference formatted as MAN-YYYY-000001. Same
 * INSERT ... ON CONFLICT ... RETURNING pattern as
 * lib/admin/reference.ts#generateNextPropertyReference — never a count() of
 * existing rows, which would race under concurrent creations.
 */
export async function generateNextMandateReference(): Promise<string> {
  const year = new Date().getFullYear();

  const rows = await prisma.$queryRaw<{ seq: number }[]>`
    INSERT INTO "MandateReferenceCounter" ("year", "seq")
    VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE SET "seq" = "MandateReferenceCounter"."seq" + 1
    RETURNING "seq"
  `;

  const seq = rows[0].seq;
  return `MAN-${year}-${String(seq).padStart(6, "0")}`;
}

/** Same pattern as generateNextMandateReference, for COM-YYYY-000001 commission-case references. */
export async function generateNextCommissionReference(): Promise<string> {
  const year = new Date().getFullYear();

  const rows = await prisma.$queryRaw<{ seq: number }[]>`
    INSERT INTO "CommissionReferenceCounter" ("year", "seq")
    VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE SET "seq" = "CommissionReferenceCounter"."seq" + 1
    RETURNING "seq"
  `;

  const seq = rows[0].seq;
  return `COM-${year}-${String(seq).padStart(6, "0")}`;
}
