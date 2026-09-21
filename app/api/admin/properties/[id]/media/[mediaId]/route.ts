import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/dal";
import { deletePropertyMedia, MediaActionError, updatePropertyMedia } from "@/lib/admin/property-media-actions";
import { toPropertyMediaDto } from "@/lib/admin/property-media-dto";

type RouteParams = { params: Promise<{ id: string; mediaId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const { mediaId } = await params;
  const user = await requireAdminUser();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    const media = await updatePropertyMedia(user, mediaId, body);
    return NextResponse.json({ media: toPropertyMediaDto(media) });
  } catch (error) {
    if (error instanceof MediaActionError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { mediaId } = await params;
  const user = await requireAdminUser();

  try {
    await deletePropertyMedia(user, mediaId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof MediaActionError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    throw error;
  }
}
