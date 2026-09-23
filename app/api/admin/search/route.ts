import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/dal";
import { runGlobalSearch } from "@/lib/admin/global-search";

/**
 * Global admin search (phase 6K) — fetched on demand from the "use client"
 * command palette only, never called during SSR, so results never end up
 * in the static/initial HTML of any page.
 */
export async function GET(request: Request) {
  const user = await requireAdminUser();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const results = await runGlobalSearch(user, q);

  return NextResponse.json(results, { headers: { "Cache-Control": "private, no-store" } });
}
