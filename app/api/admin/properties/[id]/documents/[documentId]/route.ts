import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/dal";
import { deletePropertyDocument, DocumentActionError, updatePropertyDocument } from "@/lib/admin/property-document-actions";
import { toPropertyDocumentDto } from "@/lib/admin/property-document-dto";

type RouteParams = { params: Promise<{ id: string; documentId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const { documentId } = await params;
  const user = await requireAdminUser();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    const document = await updatePropertyDocument(user, documentId, body);
    return NextResponse.json({ document: toPropertyDocumentDto(document) });
  } catch (error) {
    if (error instanceof DocumentActionError) {
      return NextResponse.json({ error: error.message, code: error.code, fieldErrors: error.fieldErrors }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { documentId } = await params;
  const user = await requireAdminUser();

  try {
    await deletePropertyDocument(user, documentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof DocumentActionError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    throw error;
  }
}
