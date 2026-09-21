import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/dal";
import { addPropertyExternalLink, LinkActionError } from "@/lib/admin/property-external-link-actions";
import { listPropertyExternalLinks } from "@/lib/admin/property-external-link-queries";
import { toPropertyExternalLinkDto } from "@/lib/admin/property-external-link-dto";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id: propertyId } = await params;
  await requireAdminUser();

  const links = await listPropertyExternalLinks(propertyId);
  return NextResponse.json({ links: links.map(toPropertyExternalLinkDto) });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id: propertyId } = await params;
  const user = await requireAdminUser();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    const link = await addPropertyExternalLink(user, propertyId, body);
    return NextResponse.json({ link: toPropertyExternalLinkDto(link) }, { status: 201 });
  } catch (error) {
    if (error instanceof LinkActionError) {
      return NextResponse.json({ error: error.message, code: error.code, fieldErrors: error.fieldErrors }, { status: error.status });
    }
    throw error;
  }
}
