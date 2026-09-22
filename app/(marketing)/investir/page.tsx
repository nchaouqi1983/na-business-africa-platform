import type { Metadata } from "next";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "Investir | NA Business Africa",
  description: "Investissez dans l'immobilier premium au Maroc avec NA Business Africa.",
};

const profiles = [
  {
    title: "Diaspora marocaine",
    description: "Constituez un patrimoine immobilier au pays avec un accompagnement à distance.",
  },
  {
    title: "Investisseurs institutionnels",
    description: "Accédez à des opportunités structurées avec analyse de rendement détaillée.",
  },
  {
    title: "Particuliers fortunés",
    description: "Diversifiez votre patrimoine avec des biens rares, y compris hors marché.",
  },
];

const opportunities = [
  { label: "Rendement locatif brut", value: "5 – 8%" },
  { label: "Plus-value moyenne à 5 ans", value: "12 – 20%" },
  { label: "Villes à fort potentiel", value: "6" },
  { label: "Biens off-market disponibles", value: "2" },
];

export default function InvestirPage() {
  return (
    <div className="flex flex-col">
      <section className="bg-anthracite-950 py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 lg:px-8">
          <SectionTitle
            eyebrow="Investir"
            title="Construisez un portefeuille immobilier rentable au Maroc"
            description="Nos équipes identifient les opportunités les plus pertinentes selon votre profil et vos objectifs de rendement."
            tone="dark"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/off-market" size="lg">
              Voir les opportunités off-market
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Échanger avec un expert
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-20 lg:px-8">
        <SectionTitle eyebrow="Chiffres clés" title="Le marché immobilier premium en un coup d'œil" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {opportunities.map((item) => (
            <div key={item.label} className="flex flex-col gap-2 rounded-2xl border border-anthracite-100 p-6">
              <span className="font-display text-3xl font-semibold text-gold-600">
                {item.value}
              </span>
              <span className="text-sm text-anthracite-500">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-anthracite-50 py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:px-8">
          <SectionTitle eyebrow="Profils accompagnés" title="Un investissement pensé pour chaque profil" />
          <div className="grid gap-6 sm:grid-cols-3">
            {profiles.map((profile) => (
              <div key={profile.title} className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm">
                <Badge tone="anthracite" className="w-fit">
                  Profil
                </Badge>
                <h3 className="font-display text-base font-semibold text-anthracite-950">
                  {profile.title}
                </h3>
                <p className="text-sm leading-relaxed text-anthracite-500">{profile.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
