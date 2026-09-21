import Breadcrumb from "@/components/property/Breadcrumb";
import Button from "@/components/Button";

export default function VendreHero() {
  return (
    <section className="bg-anthracite-950 pb-16 pt-10 lg:pb-24 lg:pt-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Vendre" }]} tone="dark" />
        <div className="mt-8 max-w-2xl">
          <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-500">
            <span className="h-px w-6 bg-gold-500" aria-hidden="true" />
            Vendre votre bien
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.12] text-white sm:text-5xl">
            Confiez la vente de votre bien à un accompagnement sur mesure
          </h1>
          <p className="mt-5 max-w-xl font-display text-lg italic leading-relaxed text-anthracite-200">
            Niama positionne votre bien à sa juste valeur, le présente à une clientèle rigoureusement
            sélectionnée, et mène chaque étape de la vente avec la discrétion qu&apos;elle mérite.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="#demande-estimation" size="lg">
              Demander une estimation
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Échanger avec Niama
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
