import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isMediaVariant } from "@/lib/media/constants";
import { readMediaVariant } from "@/lib/media/storage";

type RouteParams = { params: Promise<{ mediaId: string; variant: string }> };

/**
 * The only way a browser can ever read a property photo on the public site.
 * Never exposes the original master file (no route serves it at all) and
 * only serves a variant once its bien is published and publicly reachable
 * (PUBLIC or OFF_MARKET, never BROUILLON/ARCHIVE/PRIVE) — matching the same
 * gate as lib/public-catalog/queries.ts, checked independently here so a
 * stale/guessed media id can never leak a photo for an unpublished bien.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { mediaId, variant } = await params;
  if (!isMediaVariant(variant)) {
    return NextResponse.json({ error: "Variante inconnue." }, { status: 404 });
  }

  const media = await prisma.propertyMedia.findUnique({
    where: { id: mediaId },
    select: {
      storageKey: true,
      property: { select: { publicationStatus: true, visibility: true } },
    },
  });
  if (!media) {
    return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
  }

  const { publicationStatus, visibility } = media.property;
  const isPubliclyReachable = publicationStatus === "PUBLIE" && (visibility === "PUBLIC" || visibility === "OFF_MARKET");
  if (!isPubliclyReachable) {
    return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
  }

  const buffer = await readMediaVariant(media.storageKey, variant);
  if (!buffer) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
    },
  });
}
