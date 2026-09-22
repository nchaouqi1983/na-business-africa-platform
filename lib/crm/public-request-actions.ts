"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type {
  ProspectType as DbProspectType,
  PropertyType as DbPropertyType,
  PropertyTransaction as DbTransaction,
  ProspectFormOrigin as DbProspectFormOrigin,
} from "@/lib/generated/prisma/client";
import { generateNextProspectReference } from "@/lib/crm/reference";
import { prospectFormOriginLabels } from "@/lib/crm/enum-labels";
import { propertyTypeToDb, transactionToDb } from "@/lib/admin/property-enum-maps";
import { propertyTypeLabels } from "@/lib/property-schema";
import {
  parseContactForm,
  isContactHoneypotFilled,
  parseVendreForm,
  isVendreHoneypotFilled,
  vendreBudget,
  parseOffMarketForm,
  isOffMarketHoneypotFilled,
  splitFullName,
  splitList,
  parseBudgetRange,
  type ContactSubjectValue,
} from "@/lib/crm/public-request-schema";
import { getClientIp, isRateLimited, isSubmittedTooFast } from "@/lib/crm/public-request-rate-limit";
import { zodFieldErrors } from "@/lib/admin/zod-helpers";

/**
 * Server Actions behind the public /contact, /vendre and /off-market forms
 * (phase 6G2). Every submission becomes a Prospect (or is merged into an
 * existing one — see submitPublicProspect below), source SITE_WEB, status
 * NOUVEAU, createdById left unset (no back-office user is behind a public
 * submission — see the Prospect.createdById comment in schema.prisma).
 *
 * Never call requireAdminUser() here: these run unauthenticated, from the
 * public site. Every field is parsed with the zod schemas in
 * public-request-schema.ts before it touches the database — FormData is
 * untrusted input.
 *
 * AuditLog.metadata must only ever carry ids/enum values/booleans — never
 * name/phone/email/message/budget, same rule as lib/crm/prospect-actions.ts.
 */

export type PublicRequestState = { success?: boolean; error?: string; fieldErrors?: Record<string, string> } | undefined;

const GENERIC_ERROR = "Une erreur est survenue. Merci de réessayer dans quelques instants.";
const RATE_LIMIT_ERROR = "Trop de demandes envoyées depuis cette connexion. Merci de réessayer dans quelques minutes.";

/**
 * Honeypot filled or submitted faster than a human could type -> treated as
 * spam. Returning a fake success (rather than an error) is intentional: it
 * gives an automated sender no signal that it was caught, so it has nothing
 * to adapt to. Real failures below (rate limit, validation) do surface a
 * real message, since a genuine visitor needs to know what to fix.
 */
async function guardPublicSubmission(formData: FormData, isHoneypotFilled: boolean): Promise<PublicRequestState | null> {
  const formStartedAt = formData.get("formStartedAt");
  if (isHoneypotFilled || isSubmittedTooFast(typeof formStartedAt === "string" ? formStartedAt : null)) {
    return { success: true };
  }

  const ip = await getClientIp();
  if (isRateLimited(ip)) {
    return { error: RATE_LIMIT_ERROR };
  }

  return null;
}

type PublicProspectInput = {
  formOrigin: DbProspectFormOrigin;
  type: DbProspectType;
  fullName: string;
  phone: string;
  email: string;
  searchCities?: string[];
  searchDistricts?: string[];
  searchPropertyTypes?: DbPropertyType[];
  searchTransaction?: DbTransaction;
  budgetMin?: number;
  budgetMax?: number;
  projectTimeline?: string;
  noteBlock: string;
};

/**
 * Creates a new Prospect, or — when an existing one already shares the same
 * phone or e-mail — merges into it instead: search criteria are unioned
 * (never dropped), budget/timeline are only filled in if still empty, and
 * the submission is recorded as a new dated block appended to
 * internalNotes. Nothing already on the existing row is ever overwritten.
 */
async function submitPublicProspect(input: PublicProspectInput): Promise<void> {
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();
  const searchCities = input.searchCities ?? [];
  const searchDistricts = input.searchDistricts ?? [];
  const searchPropertyTypes = input.searchPropertyTypes ?? [];

  const existing = await prisma.prospect.findFirst({ where: { OR: [{ phone }, { email }] } });

  const timestamp = new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  const noteEntry = `[${timestamp}] Nouvelle demande via le site (${prospectFormOriginLabels[input.formOrigin]}) :\n${input.noteBlock}`;

  if (existing) {
    await prisma.prospect.update({
      where: { id: existing.id },
      data: {
        searchCities: Array.from(new Set([...existing.searchCities, ...searchCities])),
        searchDistricts: Array.from(new Set([...existing.searchDistricts, ...searchDistricts])),
        searchPropertyTypes: Array.from(new Set([...existing.searchPropertyTypes, ...searchPropertyTypes])),
        searchTransaction: existing.searchTransaction ?? input.searchTransaction,
        budgetMin: existing.budgetMin ?? input.budgetMin,
        budgetMax: existing.budgetMax ?? input.budgetMax,
        projectTimeline: existing.projectTimeline ?? input.projectTimeline,
        formOrigin: existing.formOrigin ?? input.formOrigin,
        internalNotes: existing.internalNotes ? `${existing.internalNotes}\n\n${noteEntry}` : noteEntry,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "PROSPECT_PUBLIC_DUPLICATE",
        entity: "Prospect",
        entityId: existing.id,
        metadata: { formOrigin: input.formOrigin, result: "merged" },
      },
    });
  } else {
    const reference = await generateNextProspectReference();
    const { firstName, lastName } = splitFullName(input.fullName);

    const prospect = await prisma.prospect.create({
      data: {
        reference,
        type: input.type,
        kind: "PHYSIQUE",
        firstName,
        lastName,
        phone,
        email,
        source: "SITE_WEB",
        status: "NOUVEAU",
        formOrigin: input.formOrigin,
        searchCities,
        searchDistricts,
        searchPropertyTypes,
        searchTransaction: input.searchTransaction,
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
        projectTimeline: input.projectTimeline,
        internalNotes: noteEntry,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "PROSPECT_PUBLIC_CREATED",
        entity: "Prospect",
        entityId: prospect.id,
        metadata: { type: prospect.type, source: prospect.source, formOrigin: input.formOrigin, result: "created" },
      },
    });
  }

  revalidatePath("/admin/demandes");
  revalidatePath("/admin/prospects");
}

const contactSubjectToType: Record<ContactSubjectValue, DbProspectType> = {
  acheter: "ACHETEUR",
  vendre: "VENDEUR",
  investir: "INVESTISSEUR",
  "off-market": "ACHETEUR",
  autre: "AUTRE",
};

const contactSubjectLabels: Record<ContactSubjectValue, string> = {
  acheter: "Acheter un bien",
  vendre: "Vendre un bien",
  investir: "Investir",
  "off-market": "Accès off-market",
  autre: "Autre demande",
};

export async function submitContactRequest(_prevState: PublicRequestState, formData: FormData): Promise<PublicRequestState> {
  const guard = await guardPublicSubmission(formData, isContactHoneypotFilled(formData));
  if (guard) return guard;

  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    await submitPublicProspect({
      formOrigin: "CONTACT",
      type: contactSubjectToType[parsed.data.subject],
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      noteBlock: `Sujet : ${contactSubjectLabels[parsed.data.subject]}\nMessage : ${parsed.data.message}`,
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  return { success: true };
}

export async function submitVendreRequest(_prevState: PublicRequestState, formData: FormData): Promise<PublicRequestState> {
  const guard = await guardPublicSubmission(formData, isVendreHoneypotFilled(formData));
  if (guard) return guard;

  const parsed = parseVendreForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { budgetMin, budgetMax } = vendreBudget(parsed.data);
  const noteLines = [
    parsed.data.propertyType ? `Type de bien : ${propertyTypeLabels[parsed.data.propertyType]}` : null,
    `Ville : ${parsed.data.city}`,
    parsed.data.district ? `Quartier / secteur : ${parsed.data.district}` : null,
    parsed.data.surface ? `Surface approximative : ${parsed.data.surface}` : null,
    parsed.data.rooms ? `Nombre de chambres : ${parsed.data.rooms}` : null,
    parsed.data.priceMode === "amount" && parsed.data.desiredPrice ? `Prix souhaité : ${parsed.data.desiredPrice}` : "Prix souhaité : à conseiller",
    parsed.data.situation ? `Situation : ${parsed.data.situation}` : null,
    parsed.data.message ? `Message : ${parsed.data.message}` : null,
  ].filter((line): line is string => Boolean(line));

  try {
    await submitPublicProspect({
      formOrigin: "VENDRE",
      type: "VENDEUR",
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      searchCities: [parsed.data.city],
      searchDistricts: parsed.data.district ? [parsed.data.district] : [],
      searchPropertyTypes: parsed.data.propertyType ? [propertyTypeToDb[parsed.data.propertyType as keyof typeof propertyTypeToDb]] : [],
      searchTransaction: transactionToDb.vente,
      budgetMin,
      budgetMax,
      noteBlock: noteLines.join("\n"),
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  return { success: true };
}

export async function submitOffMarketRequest(_prevState: PublicRequestState, formData: FormData): Promise<PublicRequestState> {
  const guard = await guardPublicSubmission(formData, isOffMarketHoneypotFilled(formData));
  if (guard) return guard;

  const parsed = parseOffMarketForm(formData);
  if (!parsed.success) {
    return { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { budgetMin, budgetMax } = parseBudgetRange(parsed.data.budget);
  const searchCities = splitList(parsed.data.citySector);
  const noteLines = [
    parsed.data.propertyType ? `Type de bien recherché : ${propertyTypeLabels[parsed.data.propertyType]}` : null,
    parsed.data.timeline ? `Délai : ${parsed.data.timeline}` : null,
    parsed.data.message ? `Message : ${parsed.data.message}` : null,
  ].filter((line): line is string => Boolean(line));

  try {
    await submitPublicProspect({
      formOrigin: "OFF_MARKET",
      type: parsed.data.profile,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      searchCities,
      searchPropertyTypes: parsed.data.propertyType ? [propertyTypeToDb[parsed.data.propertyType as keyof typeof propertyTypeToDb]] : [],
      searchTransaction: transactionToDb.vente,
      budgetMin,
      budgetMax,
      projectTimeline: parsed.data.timeline,
      noteBlock: noteLines.join("\n") || "Demande d'accès off-market sans critère détaillé.",
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  return { success: true };
}
