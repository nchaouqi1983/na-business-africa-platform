import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { canViewRestrictedDocuments } from "@/lib/property-permissions";
import { isRestrictedDocumentType, type DocumentTypeValue } from "@/lib/documents/constants";
import { readDocumentFile } from "@/lib/documents/storage";

type RouteParams = { params: Promise<{ documentId: string }> };

/**
 * The only way a browser can ever read a document's PDF bytes. Requires a
 * valid admin session (any role — same baseline as the media streaming
 * route), tightened further for MANDAT/DOCUMENT_JURIDIQUE which additionally
 * require canViewRestrictedDocuments. Never exposes a raw filesystem path.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const user = await requireAdminUser();
  const { documentId } = await params;

  const document = await prisma.propertyDocument.findUnique({ where: { id: documentId } });
  if (!document) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }

  if (isRestrictedDocumentType(document.type as DocumentTypeValue) && !canViewRestrictedDocuments(user.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const buffer = await readDocumentFile(document.storageKey);
  if (!buffer) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const asciiFallback = document.originalFilename.replace(/[^\x20-\x7e]/g, "_");
  const encoded = encodeURIComponent(document.originalFilename);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`,
      "Cache-Control": "private, no-store",
    },
  });
}
