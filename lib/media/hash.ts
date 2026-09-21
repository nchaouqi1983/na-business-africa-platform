import "server-only";
import { createHash } from "node:crypto";

/** Used to reject obvious duplicate uploads of the same file on the same bien. */
export function sha256Hex(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}
