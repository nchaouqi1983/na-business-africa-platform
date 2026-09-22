import Reveal from "@/components/Reveal";

const steps = [
  {
    title: "Comprendre votre recherche",
    description: "Un premier échange avec Niama pour cerner précisément votre projet, vos critères et vos priorités.",
  },
  {
    title: "Qualifier le projet",
    description: "Une étape nécessaire pour honorer la confidentialité due à chaque propriétaire du portefeuille.",
  },
  {
    title: "Présenter une sélection adaptée",
    description: "Seuls les biens réellement pertinents pour votre recherche vous sont présentés, un par un.",
  },
  {
    title: "Organiser les visites de manière confidentielle",
    description: "Des visites discrètes, coordonnées personnellement, sans exposition inutile du bien ni du vendeur.",
  },
];

export default function OffMarketProcess() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
