const faqItems = [
  {
    question: "Comment se déroule l'estimation ?",
    answer:
      "Après réception de votre demande, Niama vous recontacte personnellement pour échanger sur votre bien et, si nécessaire, organiser une visite afin d'affiner l'évaluation.",
  },
  {
    question: "Puis-je vendre de manière confidentielle ?",
    answer:
      "Oui. Certains biens sont commercialisés en Off Market, sans diffusion publique, et présentés uniquement à des acquéreurs qualifiés.",
  },
  {
    question: "Dois-je préparer des documents ?",
    answer:
      "Quelques documents relatifs au bien (titre de propriété, plans, diagnostics le cas échéant) facilitent l'estimation et la constitution du dossier de vente. Niama vous indique précisément lesquels lors de votre échange.",
  },
  {
    question: "Comment sont organisées les visites ?",
    answer:
      "Les visites sont qualifiées en amont et coordonnées personnellement par Niama, afin de limiter les déplacements inutiles et de préserver la tranquillité du bien.",
  },
];

export default function VendreFaq() {
  return (
    <div className="flex flex-col gap-4">
      {faqItems.map((item) => (
        <details
          key={item.question}
          className="group rounded-2xl border border-anthracite-100 bg-white open:shadow-sm"
        >
          <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 font-display text-base font-semibold text-anthracite-950 marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500">
            {item.question}
            <svg
              viewBox="0 0 12 12"
              className="h-3 w-3 shrink-0 text-anthracite-400 transition-transform group-open:rotate-180 group-open:text-gold-600"
              fill="none"
              aria-hidden="true"
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <div className="border-t border-anthracite-100 px-5 pb-5 pt-4">
            <p className="text-sm leading-relaxed text-anthracite-500">{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
