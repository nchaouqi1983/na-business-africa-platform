import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/dal";
import { canManageImports } from "@/lib/admin/import-permissions";
import { buildImportCsvTemplate } from "@/lib/admin/import-template";

/** Downloadable CSV template for the property import pilot (phase 6J1) — SUPER_ADMIN/ADMIN only. */
export async function GET() {
  const user = await requireAdminUser();
  if (!canManageImports(user.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  return new NextResponse(buildImportCsvTemplate(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="modele-import-biens.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
