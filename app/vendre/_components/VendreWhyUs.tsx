import Reveal from "@/components/Reveal";

const reasons = [
  {
    title: "Valorisation juste",
    description:
      "Une estimation fondée sur une lecture fine du marché local, sans survalorisation ni bradage, pour positionner votre bien avec justesse.",
  },
  {
    title: "Présentation premium",
    description:
      "Une mise en valeur éditoriale de votre bien : angle, mise en récit et présentation soignée, à la hauteur de sa valeur réelle.",
  },
  {
    title: "Sélection des acquéreurs",
    description:
      "Chaque demande est qualifiée avant toute visite, pour ne recevoir que des profils réellement en mesure d'acheter.",
  },
  {
    title: "Négociation et sécurisation",
    description:
      "Niama négocie dans votre intérêt exclusif et vous accompagne jusqu'à la signature, aux côtés des professionnels du droit.",
  },
];

export default function VendreWhyUs() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {reasons.map((reason, index) => (
        <Reveal key={reason.title} delay={(index % 4) as 0 | 1 | 2 | 3} className="h-full">
          <div className="flex h-full flex-col gap-3 rounded-2xl border border-anthracite-100 bg-white p-6 shadow-sm">
            <span className="h-1 w-8 rounded-full bg-gold-500" aria-hidden="true" />
            <h3 className="font-display text-base font-semibold text-anthracite-950">{reason.title}</h3>
            <p className="text-sm leading-relaxed text-anthracite-500">{reason.description}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
