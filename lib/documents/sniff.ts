import "server-only";

/**
 * Detects a real PDF by its magic bytes ("%PDF-") rather than trusting the
 * browser-supplied `file.type` or filename extension — same rationale as
 * lib/media/image-processing.ts's sniffImageFormat.
 */
export function sniffIsPdf(buffer: Buffer): boolean {
  if (buffer.length < 5) return false;
  return buffer.subarray(0, 5).toString("latin1") === "%PDF-";
}
