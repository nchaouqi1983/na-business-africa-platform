import type { PropertyExternalLink } from "@/lib/generated/prisma/client";

export type PropertyExternalLinkDto = {
  id: string;
  type: string;
  url: string;
  title: string | null;
  visibility: string;
  sortOrder: number;
  createdAt: string;
};

export function toPropertyExternalLinkDto(link: PropertyExternalLink): PropertyExternalLinkDto {
  return {
    id: link.id,
    type: link.type,
    url: link.url,
    title: link.title,
    visibility: link.visibility,
    sortOrder: link.sortOrder,
    createdAt: link.createdAt.toISOString(),
  };
}
