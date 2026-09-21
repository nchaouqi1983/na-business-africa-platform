import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/dal";
import { addPropertyMedia, MediaActionError } from "@/lib/admin/property-media-actions";
import { listPropertyMedia } from "@/lib/admin/property-media-queries";
import { toPropertyMediaDto } from "@/lib/admin/property-media-dto";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id: propertyId } = await params;
  await requireAdminUser();

  const media = await listPropertyMedia(propertyId);
  return NextResponse.json({ media: media.map(toPropertyMediaDto) });
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
  const altTextRaw = formData.get("altText");
  const altText = typeof altTextRaw === "string" ? altTextRaw : undefined;

  try {
    const media = await addPropertyMedia(user, propertyId, file, altText);
    return NextResponse.json({ media: toPropertyMediaDto(media) }, { status: 201 });
  } catch (error) {
    if (error instanceof MediaActionError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    throw error;
  }
}
