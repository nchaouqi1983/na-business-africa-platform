import "server-only";
import sharp from "sharp";
import {
  MEDIA_VARIANTS,
  MEDIA_VARIANT_WEBP_QUALITY,
  MEDIA_VARIANT_WIDTHS,
  type AcceptedImageMimeType,
  type MediaVariant,
} from "@/lib/media/constants";

export type SniffedFormat = "jpeg" | "png" | "webp";

const MIME_BY_SNIFFED_FORMAT: Record<SniffedFormat, AcceptedImageMimeType> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Detects the real image format from its magic bytes — the browser-supplied
 * `file.type` (and even the filename extension) are just labels the client
 * chose and are never trusted for a security decision. Returns null for
 * anything that isn't one of our three accepted raster formats, which also
 * takes care of rejecting SVG (XML, executable in a browser) and GIF.
 */
export function sniffImageFormat(buffer: Buffer): SniffedFormat | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export function mimeTypeForSniffedFormat(format: SniffedFormat): AcceptedImageMimeType {
  return MIME_BY_SNIFFED_FORMAT[format];
}

export function extensionForSniffedFormat(format: SniffedFormat): string {
  return format === "jpeg" ? ".jpg" : `.${format}`;
}

export type DecodedImage = {
  width: number;
  height: number;
};

/**
 * Fully decodes the image to confirm it isn't truncated/corrupted and to
 * read its real (EXIF-orientation-corrected) dimensions. Throws on anything
 * sharp can't decode, which callers treat as "corrupted image, reject".
 */
export async function decodeImage(buffer: Buffer): Promise<DecodedImage> {
  // .rotate() with no args applies the EXIF orientation, then .toBuffer()
  // forces a full decode + re-encode pass rather than sharp's lazy metadata read,
  // so a truncated/corrupt body throws here instead of surfacing later.
  const { info } = await sharp(buffer).rotate().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height };
}

/**
 * Generates the four public WebP variants for an original image buffer.
 * Orientation is corrected (EXIF applied then discarded) and no metadata is
 * carried over — sharp strips EXIF/ICC/GPS by default unless `.withMetadata()`
 * is called, which we deliberately never do here.
 */
export async function generateVariants(buffer: Buffer): Promise<Record<MediaVariant, Buffer>> {
  const entries = await Promise.all(
    MEDIA_VARIANTS.map(async (variant) => {
      const output = await sharp(buffer)
        .rotate()
        .resize({ width: MEDIA_VARIANT_WIDTHS[variant], withoutEnlargement: true, fit: "inside" })
        .webp({ quality: MEDIA_VARIANT_WEBP_QUALITY })
        .toBuffer();
      return [variant, output] as const;
    })
  );
  return Object.fromEntries(entries) as Record<MediaVariant, Buffer>;
}
