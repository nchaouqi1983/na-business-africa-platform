import type { Metadata } from "next";
import SectionTitle from "@/components/SectionTitle";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "À propos | NA Business Africa",
  description: "Découvrez NA Business Africa, plateforme immobilière premium dédiée au marché marocain.",
};

const values = [
  { title: "Exigence", description: "Chaque bien présenté répond à des critères stricts de qualité et d'emplacement." },
  { title: "Discrétion", description: "Nos clients et propriétaires bénéficient d'une confidentialité totale." },
  { title: "Expertise locale", description: "Une connaissance fine des marchés marocains, ville par ville." },
  { title: "Accompagnement", description: "Un interlocuteur unique, de la recherche jusqu'à la signature." },
];

const team = [
  { initials: "NA", role: "Fondateur & Direction générale" },
  { initials: "SC", role: "Responsable acquisitions" },
  { initials: "LM", role: "Responsable off-market" },
];

export default function AProposPage() {
  return (
    <div className="flex flex-col">
      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-20 lg:px-8">
        <SectionTitle
          eyebrow="À propos"
          title="Une agence premium au service de l'immobilier africain"
          description="NA Business Africa accompagne particuliers, investisseurs et institutions dans l'achat, la vente et l'investissement immobilier au Maroc, avec une exigence de service inspirée des standards internationaux."
        />
      </section>

      <section className="bg-anthracite-50 py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:px-8">
          <SectionTitle eyebrow="Nos valeurs" title="Ce qui guide notre approche" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-display text-base font-semibold text-anthracite-950">
                  {value.title}
                </h3>
                <p className="text-sm leading-relaxed text-anthracite-500">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-20 lg:px-8">
        <SectionTitle eyebrow="Équipe" title="Une équipe dédiée à vos projets" />
        <div className="grid gap-6 sm:grid-cols-3">
          {team.map((member) => (
            <div key={member.role} className="flex items-center gap-4 rounded-2xl border border-anthracite-100 p-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-anthracite-950 font-display text-lg font-semibold text-gold-400">
                {member.initials}
              </span>
              <span className="text-sm font-medium text-anthracite-700">{member.role}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-anthracite-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-20 text-center lg:px-8">
          <SectionTitle
            eyebrow="Contact"
            title="Envie d'échanger avec notre équipe ?"
            tone="dark"
            align="center"
          />
          <Button href="/contact" size="lg">
            Nous contacter
          </Button>
        </div>
      </section>
    </div>
  );
}
