import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Call after any admin mutation that could change what the public site
 * shows for a bien — dossier fields, publication state, tags, media,
 * documents or external links. Cheap and safe to call even when the change
 * turns out not to be publicly visible (e.g. a still-BROUILLON bien): an
 * extra revalidation of a page whose content didn't change is a no-op.
 *
 * `slugs` covers both the current slug and, when a dossier edit renamed the
 * title, the previous slug — so a URL that used to work reliably 404s
 * instead of keeping stale cached content.
 */
export function revalidatePublicPropertyPaths(...slugs: (string | null | undefined)[]): void {
  revalidatePath("/");
  revalidatePath("/explorer");
  revalidatePath("/acheter");
  revalidatePath("/off-market");
  revalidatePath("/villes");
  for (const slug of slugs) {
    if (slug) revalidatePath(`/biens/${slug}`);
  }
}
