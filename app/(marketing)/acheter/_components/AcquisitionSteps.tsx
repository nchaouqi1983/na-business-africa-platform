import Reveal from "@/components/Reveal";

const steps = [
  {
    title: "Écouter",
    description: "Un premier échange avec Niama pour cerner votre projet : usage, budget, calendrier et priorités.",
  },
  {
    title: "Sélectionner",
    description: "Une short-list de biens réellement pertinents, y compris certaines opportunités off-market selon votre profil.",
  },
  {
    title: "Visiter",
    description: "Des visites accompagnées, avec un regard d'expert sur l'emplacement, l'état et le potentiel de chaque bien.",
  },
  {
    title: "Négocier",
    description: "Une négociation menée avec tact, dans l'intérêt de votre projet, jusqu'à l'accord final.",
  },
  {
    title: "Sécuriser",
    description: "Vérifications juridiques et suivi jusqu'à la signature, aux côtés de notaires et experts partenaires.",
  },
];

export default function AcquisitionSteps() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((step, index) => (
        <Reveal key={step.title} delay={(index % 4) as 0 | 1 | 2 | 3} className="h-full">
          <div className="flex h-full flex-col gap-3 rounded-2xl border border-anthracite-100 p-6">
            <span className="font-display text-2xl font-semibold text-gold-600">
              0{index + 1}
            </span>
            <h3 className="font-display text-base font-semibold text-anthracite-950">{step.title}</h3>
            <p className="text-sm leading-relaxed text-anthracite-500">{step.description}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
