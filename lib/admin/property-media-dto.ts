import type { PropertyMedia } from "@/lib/generated/prisma/client";
import { mediaVariantUrls } from "@/lib/media/urls";

export type PropertyMediaDto = {
  id: string;
  sortOrder: number;
  isCover: boolean;
  altText: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  urls: ReturnType<typeof mediaVariantUrls>;
};

export function toPropertyMediaDto(media: PropertyMedia): PropertyMediaDto {
  return {
    id: media.id,
    sortOrder: media.sortOrder,
    isCover: media.isCover,
    altText: media.altText,
    width: media.width,
    height: media.height,
    createdAt: media.createdAt.toISOString(),
    urls: mediaVariantUrls(media.id),
  };
}
