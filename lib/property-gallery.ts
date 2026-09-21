// Données de galerie — NA Business Africa
// Tant qu'aucune photographie réelle n'est fournie via Property.media.gallery,
// cette fonction dérive une galerie locale à partir du dégradé de la fiche
// (aucune image externe, aucun base64). Dès que des photos réelles sont
// ajoutées au schéma, elles sont automatiquement servies via next/image.

import type { Property } from "./property-schema";

export type GalleryPhoto =
  | { kind: "image"; src: string; alt: string }
  | { kind: "placeholder"; gradientClassName: string; alt: string };

export type PropertyGalleryData = {
  photos: GalleryPhoto[];
  video?: string;
  virtualTour?: string;
};

const placeholderDirections = [
  "bg-gradient-to-br",
  "bg-gradient-to-tr",
  "bg-gradient-to-t",
  "bg-gradient-to-bl",
  "bg-gradient-to-tl",
  "bg-gradient-to-r",
] as const;

export function getPropertyGallery(property: Property): PropertyGalleryData {
  const { gallery, video, virtualTour, placeholderGradient } = property.media;

  if (gallery.length > 0) {
    return {
      photos: gallery.map((src, index) => ({
        kind: "image" as const,
        src,
        alt: `${property.title.fr} — photo ${index + 1}`,
      })),
      video,
      virtualTour,
    };
  }

  const photos: GalleryPhoto[] = placeholderDirections.map((direction, index) => ({
    kind: "placeholder" as const,
    gradientClassName: `${direction} ${placeholderGradient}`,
    alt: `${property.title.fr} — ambiance ${index + 1}`,
  }));

  return { photos, video, virtualTour };
}
