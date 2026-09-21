"use client";

import Image from "next/image";
import { useState } from "react";
import type { GalleryPhoto } from "@/lib/property-gallery";

type GalleryTab = "photos" | "video" | "tour";

type PropertyGalleryProps = {
  title: string;
  photos: GalleryPhoto[];
  video?: string;
  virtualTour?: string;
};

const sizes = "(min-width: 1024px) 66vw, 100vw";
const thumbSizes = "(min-width: 1024px) 16vw, 33vw";

function GalleryFrame({
  photo,
  preload,
  sizesAttr,
}: {
  photo: GalleryPhoto;
  preload: boolean;
  sizesAttr: string;
}) {
  if (photo.kind === "image") {
    return (
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        preload={preload}
        loading={preload ? "eager" : "lazy"}
        sizes={sizesAttr}
        className="object-cover"
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={photo.alt}
      className={`h-full w-full ${photo.gradientClassName}`}
    />
  );
}

export default function PropertyGallery({ title, photos, video, virtualTour }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState<GalleryTab>("photos");

  const total = photos.length;
  const active = photos[activeIndex] ?? photos[0];
  const thumbnails = photos.slice(1, 5);
  const remaining = total - 1 - thumbnails.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("photos")}
            aria-pressed={tab === "photos"}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              tab === "photos"
                ? "bg-anthracite-950 text-white"
                : "border border-anthracite-200 text-anthracite-600 hover:border-gold-500 hover:text-gold-600"
            }`}
          >
            Photos
          </button>
          {video && (
            <button
              type="button"
              onClick={() => setTab("video")}
              aria-pressed={tab === "video"}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                tab === "video"
                  ? "bg-anthracite-950 text-white"
                  : "border border-anthracite-200 text-anthracite-600 hover:border-gold-500 hover:text-gold-600"
              }`}
            >
              Vidéo
            </button>
          )}
          {virtualTour && (
            <button
              type="button"
              onClick={() => setTab("tour")}
              aria-pressed={tab === "tour"}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                tab === "tour"
                  ? "bg-anthracite-950 text-white"
                  : "border border-anthracite-200 text-anthracite-600 hover:border-gold-500 hover:text-gold-600"
              }`}
            >
              Visite virtuelle
            </button>
          )}
        </div>
        {tab === "photos" && (
          <span className="rounded-full bg-anthracite-950/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
            {activeIndex + 1} / {total}
          </span>
        )}
      </div>

      {tab === "photos" && (
        <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm lg:aspect-auto">
            <GalleryFrame photo={active} preload={activeIndex === 0} sizesAttr={sizes} />
          </div>

          <div className="grid grid-cols-4 gap-3 lg:grid-cols-2">
            {thumbnails.map((photo, index) => {
              const photoIndex = index + 1;
              const isLastVisible = index === thumbnails.length - 1 && remaining > 0;
              return (
                <button
                  key={photoIndex}
                  type="button"
                  onClick={() => setActiveIndex(photoIndex)}
                  aria-label={`Voir la photo ${photoIndex + 1} sur ${total}`}
                  className="group relative aspect-square overflow-hidden rounded-sm ring-1 ring-inset ring-white/10 transition-opacity hover:opacity-90 lg:aspect-[4/3]"
                >
                  <GalleryFrame photo={photo} preload={false} sizesAttr={thumbSizes} />
                  {isLastVisible && (
                    <span className="absolute inset-0 flex items-center justify-center bg-anthracite-950/60 text-sm font-semibold text-white">
                      +{remaining} photos
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === "video" && video && (
        <div className="flex aspect-video items-center justify-center rounded-sm bg-anthracite-950">
          <p className="max-w-sm px-6 text-center text-sm text-anthracite-300">
            Vidéo disponible sur demande auprès de votre conseiller — lecture intégrée à venir.
          </p>
        </div>
      )}

      {tab === "tour" && virtualTour && (
        <div className="flex aspect-video items-center justify-center rounded-sm bg-anthracite-950">
          <p className="max-w-sm px-6 text-center text-sm text-anthracite-300">
            Visite virtuelle « {title} » disponible sur demande auprès de votre conseiller.
          </p>
        </div>
      )}
    </div>
  );
}
