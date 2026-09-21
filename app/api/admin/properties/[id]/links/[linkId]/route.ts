import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/dal";
import { deletePropertyExternalLink, LinkActionError, updatePropertyExternalLink } from "@/lib/admin/property-external-link-actions";
import { toPropertyExternalLinkDto } from "@/lib/admin/property-external-link-dto";

type RouteParams = { params: Promise<{ id: string; linkId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const { linkId } = await params;
  const user = await requireAdminUser();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    const link = await updatePropertyExternalLink(user, linkId, body);
    return NextResponse.json({ link: toPropertyExternalLinkDto(link) });
  } catch (error) {
    if (error instanceof LinkActionError) {
      return NextResponse.json({ error: error.message, code: error.code, fieldErrors: error.fieldErrors }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { linkId } = await params;
  const user = await requireAdminUser();

  try {
    await deletePropertyExternalLink(user, linkId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof LinkActionError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    throw error;
  }
}
