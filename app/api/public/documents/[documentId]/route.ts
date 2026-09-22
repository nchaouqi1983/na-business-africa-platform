import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readDocumentFile } from "@/lib/documents/storage";

type RouteParams = { params: Promise<{ documentId: string }> };

/**
 * The only way a browser can ever read a property document on the public
 * site. Restricted to BROCHURE/PLAN and requires visibility PUBLIABLE — a
 * DOCUMENT_JURIDIQUE or MANDAT is refused here even if it were ever marked
 * PUBLIABLE by mistake, and even that flag itself is server-forced back to
 * INTERNE for OFF_MARKET/PRIVE biens (see resolveVisibility in
 * lib/admin/property-document-actions.ts). Only serves once the bien is
 * published and publicly reachable (PUBLIC or OFF_MARKET).
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { documentId } = await params;

  const document = await prisma.propertyDocument.findUnique({
    where: { id: documentId },
    select: {
      type: true,
      visibility: true,
      storageKey: true,
      originalFilename: true,
      property: { select: { publicationStatus: true, visibility: true } },
    },
  });
  if (!document) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }

  const isAllowedType = document.type === "BROCHURE" || document.type === "PLAN";
  const { publicationStatus, visibility } = document.property;
  const isPubliclyReachable = publicationStatus === "PUBLIE" && (visibility === "PUBLIC" || visibility === "OFF_MARKET");

  if (!isAllowedType || document.visibility !== "PUBLIABLE" || !isPubliclyReachable) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }

  const buffer = await readDocumentFile(document.storageKey);
  if (!buffer) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const safeFilename = document.originalFilename.replace(/[^\x20-\x7E]/g, "").replace(/"/g, "");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeFilename}"`,
      "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
    },
  });
}
