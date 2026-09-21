import Button from "@/components/Button";
import Reveal from "@/components/Reveal";

export default function VendreOffMarketBlock() {
  return (
    <div id="off-market" className="scroll-mt-28">
      <Reveal>
        <div className="flex flex-col gap-6 rounded-2xl bg-anthracite-950 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-500">
              <span className="h-px w-6 bg-gold-500" aria-hidden="true" />
              Discrétion totale
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold text-white sm:text-3xl">
              Une commercialisation confidentielle, si vous la préférez
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-anthracite-200">
              Certains propriétaires préfèrent une diffusion ciblée et discrète, sans exposition publique de leur
              bien. Niama propose alors une commercialisation Off Market, réservée à un nombre restreint
              d&apos;acquéreurs qualifiés.
            </p>
          </div>
          <Button href="/off-market" variant="secondary" size="lg" className="shrink-0">
            Découvrir l&apos;Off Market
          </Button>
        </div>
      </Reveal>
    </div>
  );
}
