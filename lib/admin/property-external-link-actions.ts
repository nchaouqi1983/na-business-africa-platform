import "server-only";
import { prisma } from "@/lib/db";
import type { AuthenticatedUser } from "@/lib/auth/dal";
import { canEditProperty } from "@/lib/property-permissions";
import {
  getExternalLinkWithProperty,
  getPropertyForLinkAccess,
  countPropertyExternalLinks,
} from "@/lib/admin/property-external-link-queries";
import {
  createExternalLinkSchema,
  patchExternalLinkSchema,
  reorderExternalLinksSchema,
  validateExternalLinkUrl,
  type PatchExternalLinkInput,
} from "@/lib/admin/property-external-link-schema";
import { MAX_LINKS_PER_PROPERTY, type ExternalLinkTypeValue } from "@/lib/external-links/constants";

export type LinkActionErrorCode = "NOT_FOUND" | "FORBIDDEN" | "LIMIT_REACHED" | "BAD_REQUEST";

const STATUS_BY_CODE: Record<LinkActionErrorCode, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  LIMIT_REACHED: 409,
  BAD_REQUEST: 400,
};

export class LinkActionError extends Error {
  code: LinkActionErrorCode;
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(code: LinkActionErrorCode, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.fieldErrors = fieldErrors;
  }
}

async function assertCanEditProperty(user: AuthenticatedUser, propertyId: string) {
  const property = await getPropertyForLinkAccess(propertyId);
  if (!property) throw new LinkActionError("NOT_FOUND", "Bien introuvable.");
  if (!canEditProperty(user.role, user.id, property)) {
    throw new LinkActionError("FORBIDDEN", "Vous n'avez pas le droit de modifier les liens de ce bien.");
  }
  return property;
}

/** OFF_MARKET/PRIVE biens never get a publiable link — enforced server-side regardless of what the form sent. */
function resolveVisibility(propertyVisibility: string, requested: "INTERNE" | "PUBLIABLE") {
  if (propertyVisibility === "OFF_MARKET" || propertyVisibility === "PRIVE") return "INTERNE" as const;
  return requested;
}

export async function addPropertyExternalLink(user: AuthenticatedUser, propertyId: string, rawBody: unknown) {
  const property = await assertCanEditProperty(user, propertyId);

  const parsed = createExternalLinkSchema.safeParse(rawBody);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new LinkActionError("BAD_REQUEST", issue?.message ?? "Requête invalide.", {
      [String(issue?.path[0] ?? "url")]: issue?.message ?? "Invalide.",
    });
  }
  const input = parsed.data;

  const urlCheck = validateExternalLinkUrl(input.type, input.url);
  if (!urlCheck.ok) {
    throw new LinkActionError("BAD_REQUEST", urlCheck.message, { url: urlCheck.message });
  }

  const existingCount = await countPropertyExternalLinks(propertyId);
  if (existingCount >= MAX_LINKS_PER_PROPERTY) {
    throw new LinkActionError("LIMIT_REACHED", `Limite de ${MAX_LINKS_PER_PROPERTY} liens atteinte pour ce bien.`);
  }

  const link = await prisma.propertyExternalLink.create({
    data: {
      propertyId,
      type: input.type,
      url: urlCheck.url,
      title: input.title?.trim() ? input.title.trim() : null,
      visibility: resolveVisibility(property.visibility, input.visibility),
      sortOrder: existingCount,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PROPERTY_LINK_ADDED",
      entity: "Property",
      entityId: propertyId,
      metadata: { reference: property.reference, linkId: link.id, type: input.type },
    },
  });

  return link;
}

export async function updatePropertyExternalLink(user: AuthenticatedUser, linkId: string, rawPatch: unknown) {
  const link = await getExternalLinkWithProperty(linkId);
  if (!link) throw new LinkActionError("NOT_FOUND", "Lien introuvable.");
  if (!canEditProperty(user.role, user.id, link.property)) {
    throw new LinkActionError("FORBIDDEN", "Vous n'avez pas le droit de modifier les liens de ce bien.");
  }

  const parsed = patchExternalLinkSchema.safeParse(rawPatch);
  if (!parsed.success) {
    throw new LinkActionError("BAD_REQUEST", "Requête invalide.", { url: parsed.error.issues[0]?.message ?? "Invalide." });
  }
  const patch: PatchExternalLinkInput = parsed.data;

  const nextType = (patch.type ?? link.type) as ExternalLinkTypeValue;
  let nextUrl: string | undefined;
  if (patch.url !== undefined) {
    const urlCheck = validateExternalLinkUrl(nextType, patch.url);
    if (!urlCheck.ok) {
      throw new LinkActionError("BAD_REQUEST", urlCheck.message, { url: urlCheck.message });
    }
    nextUrl = urlCheck.url;
  } else if (patch.type !== undefined) {
    // Type changed without a new URL — re-validate the existing URL against the new type's domain allowlist.
    const urlCheck = validateExternalLinkUrl(nextType, link.url);
    if (!urlCheck.ok) {
      throw new LinkActionError("BAD_REQUEST", "L'URL existante n'est pas valide pour ce nouveau type de lien.", {
        type: "L'URL existante n'est pas valide pour ce nouveau type de lien.",
      });
    }
  }

  const visibility =
    patch.visibility !== undefined ? resolveVisibility(link.property.visibility, patch.visibility) : undefined;

  const updated = await prisma.propertyExternalLink.update({
    where: { id: linkId },
    data: {
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(nextUrl !== undefined ? { url: nextUrl } : {}),
      ...(patch.title !== undefined ? { title: patch.title?.trim() || null } : {}),
      ...(visibility !== undefined ? { visibility } : {}),
    },
  });

  return updated;
}

export async function deletePropertyExternalLink(user: AuthenticatedUser, linkId: string) {
  const link = await getExternalLinkWithProperty(linkId);
  if (!link) throw new LinkActionError("NOT_FOUND", "Lien introuvable.");
  if (!canEditProperty(user.role, user.id, link.property)) {
    throw new LinkActionError("FORBIDDEN", "Vous n'avez pas le droit de modifier les liens de ce bien.");
  }

  await prisma.propertyExternalLink.delete({ where: { id: linkId } });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PROPERTY_LINK_REMOVED",
      entity: "Property",
      entityId: link.propertyId,
      metadata: { reference: link.property.reference, linkId, type: link.type },
    },
  });
}

export async function reorderPropertyExternalLinks(user: AuthenticatedUser, propertyId: string, rawBody: unknown) {
  const property = await assertCanEditProperty(user, propertyId);

  const parsed = reorderExternalLinksSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new LinkActionError("BAD_REQUEST", "Requête invalide.");
  }
  const { order } = parsed.data;

  const existing = await prisma.propertyExternalLink.findMany({ where: { propertyId }, select: { id: true } });
  const existingIds = new Set(existing.map((row) => row.id));
  const isValidPermutation = order.length === existingIds.size && order.every((id) => existingIds.has(id));
  if (!isValidPermutation) {
    throw new LinkActionError("BAD_REQUEST", "L'ordre fourni ne correspond pas aux liens existants.");
  }

  await prisma.$transaction(order.map((id, index) => prisma.propertyExternalLink.update({ where: { id }, data: { sortOrder: index } })));

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PROPERTY_LINKS_REORDERED",
      entity: "Property",
      entityId: propertyId,
      metadata: { reference: property.reference, linkCount: order.length },
    },
  });
}
