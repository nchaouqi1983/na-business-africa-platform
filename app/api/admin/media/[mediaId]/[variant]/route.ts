import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { isMediaVariant } from "@/lib/media/constants";
import { readMediaVariant } from "@/lib/media/storage";

type RouteParams = { params: Promise<{ mediaId: string; variant: string }> };

/**
 * The only way a browser can ever read a generated image variant. Requires a
 * valid admin session (any role — VIEWER included, since viewing a bien's
 * dossier is allowed for every admin-accessible role) and never exposes the
 * original master file, which has no route at all.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  await requireAdminUser();

  const { mediaId, variant } = await params;
  if (!isMediaVariant(variant)) {
    return NextResponse.json({ error: "Variante inconnue." }, { status: 404 });
  }

  const media = await prisma.propertyMedia.findUnique({
    where: { id: mediaId },
    select: { storageKey: true },
  });
  if (!media) {
    return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
  }

  const buffer = await readMediaVariant(media.storageKey, variant);
  if (!buffer) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=86400, immutable",
    },
  });
}
