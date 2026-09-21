import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/dal";
import { MediaActionError, reorderPropertyMedia } from "@/lib/admin/property-media-actions";

type RouteParams = { params: Promise<{ id: string }> };

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
    await reorderPropertyMedia(user, propertyId, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof MediaActionError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    throw error;
  }
}
