import "server-only";
import { prisma } from "@/lib/db";

export const ORGANIZATION_SETTINGS_ID = "default";

export type OrganizationSettingsDto = {
  agencyName: string;
  tagline: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  website: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  defaultLanguage: string;
  timezone: string;
  defaultCurrency: string;
  updatedAt: Date | null;
};

/** Returns the singleton row, or the schema defaults when it has never been saved yet (read never creates it). */
export async function getOrganizationSettings(): Promise<OrganizationSettingsDto> {
  const row = await prisma.organizationSettings.findUnique({
    where: { id: ORGANIZATION_SETTINGS_ID },
    omit: { id: true, updatedById: true, createdAt: true },
  });
  if (row) return row;
  return {
    agencyName: "NA Business Africa",
    tagline: null,
    email: null,
    phone: null,
    whatsapp: null,
    address: null,
    city: null,
    website: null,
    instagramUrl: null,
    facebookUrl: null,
    linkedinUrl: null,
    defaultLanguage: "fr",
    timezone: "Africa/Casablanca",
    defaultCurrency: "MAD",
    updatedAt: null,
  };
}
