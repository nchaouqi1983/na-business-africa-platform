import { orientationLabels, proximityFields, type Property } from "@/lib/properties";

type PropertyLocationBlockProps = {
  property: Property;
  discreet: boolean;
};

export default function PropertyLocationBlock({ property, discreet }: PropertyLocationBlockProps) {
  const { location } = property;
  const proximities = proximityFields.filter(({ key }) => location.proximities[key] !== undefined);
  const showDistrict = !discreet && location.mapPrecision !== "masquee";

  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-2xl font-semibold text-anthracite-950">Localisation</h2>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-anthracite-950">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(201,162,39,0.25),transparent_60%)]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-400/60 text-gold-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.4" />
              </svg>
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-white">
                {showDistrict && location.district ? `${location.district}, ${location.city}` : location.city}
              </p>
              <p className="text-xs uppercase tracking-wider text-anthracite-300">{location.region}</p>
            </div>
            {discreet && (
              <p className="max-w-[220px] text-xs text-anthracite-400">
                Localisation précise communiquée après confirmation de votre profil acquéreur.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {location.orientation && !discreet && (
            <p className="text-sm text-anthracite-600">
              Orientation : <span className="font-medium text-anthracite-900">{orientationLabels[location.orientation]}</span>
            </p>
          )}
          {proximities.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-600">À proximité</h3>
              <ul className="flex flex-col gap-1.5 text-sm text-anthracite-600">
                {proximities.map(({ key, label }) => (
                  <li key={key} className="flex items-center justify-between border-b border-anthracite-100 py-1.5">
                    <span>{label}</span>
                    <span className="font-medium text-anthracite-900">{location.proximities[key]} km</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
