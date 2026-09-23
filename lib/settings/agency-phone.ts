import "server-only";
import { cache } from "react";
import { getOrganizationSettings } from "@/lib/settings/organization-queries";
import { AGENCY_PHONE_FALLBACK } from "@/lib/site-config";

export type AgencyPhone = {
  /** Human-readable number, as configured. */
  display: string;
  /** Ready-to-use `tel:` href (E.164-style: leading + and digits only). */
  href: string;
};

function toTelHref(phone: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 6) return null;
  // "00212…" is the international prefix written out — normalise it to "+212…".
  if (trimmed.startsWith("+")) return `tel:+${digits}`;
  if (digits.startsWith("00")) return `tel:+${digits.slice(2)}`;
  return `tel:${digits}`;
}

/**
 * The agency's own public phone (OrganizationSettings, falling back to the
 * site's historical number) — the only number public "Appeler" buttons may
 * use. Never a bien's owner/intermediary phone. Deduped per request.
 */
export const getAgencyPhone = cache(async (): Promise<AgencyPhone> => {
  const settings = await getOrganizationSettings();
  const configured = settings.phone?.trim();
  const href = configured ? toTelHref(configured) : null;
  if (configured && href) return { display: configured, href };
  return { display: AGENCY_PHONE_FALLBACK, href: toTelHref(AGENCY_PHONE_FALLBACK)! };
});
