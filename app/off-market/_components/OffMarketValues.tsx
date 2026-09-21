import Reveal from "@/components/Reveal";

const values = [
  {
    title: "Confidentialité totale",
    description: "Aucune diffusion publique : chaque dossier est présenté individuellement, aux seuls profils qualifiés.",
  },
  {
    title: "Sélection personnalisée",
    description: "Une short-list pensée pour votre projet précis, jamais une liste générique de biens disponibles.",
  },
  {
    title: "Opportunités rares",
    description: "Un accès à des biens que vous ne retrouverez sur aucun portail, ni aucune vitrine publique.",
  },
  {
    title: "Accompagnement discret",
    description: "Niama suit personnellement chaque demande, de la qualification jusqu'à la visite.",
  },
];

export default function OffMarketValues() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {values.map((value, index) => (
        <Reveal key={value.title} delay={(index % 4) as 0 | 1 | 2 | 3} className="h-full">
          <div className="flex h-full flex-col gap-3 rounded-2xl border border-anthracite-100 bg-white p-6 shadow-sm">
            <span className="h-1 w-8 rounded-full bg-gold-500" aria-hidden="true" />
            <h3 className="font-display text-base font-semibold text-anthracite-950">{value.title}</h3>
            <p className="text-sm leading-relaxed text-anthracite-500">{value.description}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
