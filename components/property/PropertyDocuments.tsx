import type { Property } from "@/lib/properties";

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    </svg>
  );
}

export default function PropertyDocuments({ property }: { property: Property }) {
  const { brochurePdf, floorPlans, video, virtualTour } = property.media;
  const entries = [
    brochurePdf ? { label: "Brochure PDF", href: brochurePdf } : null,
    floorPlans && floorPlans.length > 0 ? { label: `Plans (${floorPlans.length})`, href: floorPlans[0] } : null,
    video ? { label: "Vidéo", href: video } : null,
    virtualTour ? { label: "Visite virtuelle", href: virtualTour } : null,
  ].filter((entry): entry is { label: string; href: string } => entry !== null);

  if (entries.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-semibold text-anthracite-950">Documents et médias</h2>
      <div className="flex flex-wrap gap-3">
        {entries.map((entry) => (
          <a
            key={entry.label}
            href={entry.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-anthracite-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-anthracite-700 transition-colors hover:border-gold-500 hover:text-gold-600"
          >
            <DocumentIcon />
            {entry.label}
          </a>
        ))}
      </div>
    </section>
  );
}
