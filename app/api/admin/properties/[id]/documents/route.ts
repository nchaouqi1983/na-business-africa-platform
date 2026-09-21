import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/dal";
import { addPropertyDocument, DocumentActionError } from "@/lib/admin/property-document-actions";
import { listPropertyDocuments } from "@/lib/admin/property-document-queries";
import { toPropertyDocumentDto } from "@/lib/admin/property-document-dto";
import { canViewRestrictedDocuments } from "@/lib/property-permissions";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id: propertyId } = await params;
  const user = await requireAdminUser();

  const documents = await listPropertyDocuments(propertyId, canViewRestrictedDocuments(user.role));
  return NextResponse.json({ documents: documents.map(toPropertyDocumentDto) });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id: propertyId } = await params;
  const user = await requireAdminUser();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
  }

  const meta = {
    type: formData.get("type"),
    title: formData.get("title"),
    visibility: formData.get("visibility") || undefined,
  };

  try {
    const document = await addPropertyDocument(user, propertyId, file, meta);
    return NextResponse.json({ document: toPropertyDocumentDto(document) }, { status: 201 });
  } catch (error) {
    if (error instanceof DocumentActionError) {
      return NextResponse.json({ error: error.message, code: error.code, fieldErrors: error.fieldErrors }, { status: error.status });
    }
    throw error;
  }
}
