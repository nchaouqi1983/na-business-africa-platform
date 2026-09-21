import Reveal from "@/components/Reveal";

const steps = [
  {
    marker: "I",
    title: "Comprendre le bien et votre projet",
    description:
      "Un premier échange pour cerner le bien, son histoire, et vos objectifs : délai souhaité, priorités, situation personnelle.",
  },
  {
    marker: "II",
    title: "Positionner le bien sur le marché",
    description:
      "Analyse comparative du marché local pour définir un positionnement cohérent et argumenté.",
  },
  {
    marker: "III",
    title: "Préparer photos, contenu et dossier",
    description:
      "Reportage photographique, rédaction éditoriale et constitution d'un dossier complet, diffusés sur les canaux les plus pertinents.",
  },
  {
    marker: "IV",
    title: "Qualifier les demandes et organiser les visites",
    description:
      "Chaque demande est qualifiée avant la mise en relation ; les visites sont organisées avec discrétion.",
  },
  {
    marker: "V",
    title: "Négocier et accompagner jusqu'à la finalisation",
    description:
      "Sélection et négociation des offres, accompagnement jusqu'à la signature aux côtés des professionnels du droit.",
  },
];

export default function VendreMethod() {
  return (
    <div className="flex flex-col gap-10">
      <div className="relative flex flex-col gap-10 pl-11 before:absolute before:bottom-1 before:left-[11px] before:top-1 before:w-px before:bg-anthracite-100">
        {steps.map((step, index) => (
          <Reveal key={step.marker} delay={(index % 4) as 0 | 1 | 2 | 3}>
            <div className="relative">
              <span className="absolute -left-11 top-0 flex h-6 w-6 items-center justify-center rounded-full border border-gold-500 bg-white font-display text-xs italic text-gold-600">
                {step.marker}
              </span>
              <h3 className="font-display text-base font-semibold text-anthracite-950">{step.title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-anthracite-500">{step.description}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="flex flex-col gap-2 rounded-2xl border border-gold-300 bg-gold-200/20 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-anthracite-700">
            Pour certains biens, une commercialisation confidentielle — sans diffusion publique — peut également
            être proposée.
          </p>
          <a
            href="#off-market"
            className="shrink-0 text-xs font-semibold uppercase tracking-wider text-gold-600 hover:text-gold-500"
          >
            En savoir plus →
          </a>
        </div>
      </Reveal>
    </div>
  );
}
