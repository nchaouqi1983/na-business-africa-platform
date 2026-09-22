"use client";

import { useActionState } from "react";
import { budgetRanges } from "@/components/SearchBar";
import { propertyTypeLabels, propertyTypeValues } from "@/lib/properties";
import { submitOffMarketRequest } from "@/lib/crm/public-request-actions";
import HoneypotField from "@/components/HoneypotField";

const timelines = [
  "Dès que possible",
  "Sous 3 mois",
  "Sous 6 mois",
  "Flexible / à définir",
];

const trustPoints = [
  {
    title: "Étude personnelle",
    description: "Chaque demande est lue et qualifiée directement par Niama.",
  },
  {
    title: "Réponse discrète",
    description: "Un premier retour par téléphone ou par email, sans sollicitation publique.",
  },
  {
    title: "Confidentialité totale",
    description: "Vos informations ne sont jamais partagées ni utilisées à d'autres fins.",
  },
];

const errorClass = "text-xs text-red-600";

export default function OffMarketRequestForm() {
  const [state, formAction, pending] = useActionState(submitOffMarketRequest, undefined);
  const submitted = state?.success === true;

  return (
    <div id="demande" className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
            Accès sur dossier
          </span>
          <h2 className="font-display text-2xl font-semibold text-anthracite-950 sm:text-3xl">
            Faire une demande confidentielle
          </h2>
          <p className="text-sm leading-relaxed text-anthracite-500">
            Cette étape n&apos;est pas une formalité : elle permet à Niama de comprendre votre recherche et de ne
            vous présenter que des opportunités réellement adaptées à votre projet.
          </p>
        </div>
        <div className="flex flex-col gap-5">
          {trustPoints.map((point) => (
            <div key={point.title} className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden="true" />
              <div>
                <h3 className="font-display text-sm font-semibold text-anthracite-950">{point.title}</h3>
                <p className="text-sm text-anthracite-500">{point.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 shadow-sm sm:p-8">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-gold-300 bg-gold-200/30 px-6 py-12 text-center">
            <p className="font-display text-lg font-semibold text-anthracite-950">
              Votre demande a bien été reçue.
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-anthracite-600">
              Notre équipe vous recontactera rapidement. Niama va étudier votre recherche personnellement.
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">
              Votre demande reste strictement confidentielle.
            </p>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <HoneypotField />

            {state?.error && (
              <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">
                  Nom complet
                </span>
                <input
                  required
                  type="text"
                  name="fullName"
                  aria-describedby={state?.fieldErrors?.fullName ? "offmarket-fullName-error" : undefined}
                  className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
                {state?.fieldErrors?.fullName && (
                  <p id="offmarket-fullName-error" role="alert" className={errorClass}>
                    {state.fieldErrors.fullName}
                  </p>
                )}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">
                  Téléphone
                </span>
                <input
                  required
                  type="tel"
                  name="phone"
                  aria-describedby={state?.fieldErrors?.phone ? "offmarket-phone-error" : undefined}
                  className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
                {state?.fieldErrors?.phone && (
                  <p id="offmarket-phone-error" role="alert" className={errorClass}>
                    {state.fieldErrors.phone}
                  </p>
                )}
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Email</span>
              <input
                required
                type="email"
                name="email"
                aria-describedby={state?.fieldErrors?.email ? "offmarket-email-error" : undefined}
                className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
              {state?.fieldErrors?.email && (
                <p id="offmarket-email-error" role="alert" className={errorClass}>
                  {state.fieldErrors.email}
                </p>
              )}
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Vous êtes</span>
              <select
                name="profile"
                defaultValue="ACHETEUR"
                className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                <option value="ACHETEUR">Acheteur</option>
                <option value="INVESTISSEUR">Investisseur</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">
                Ville / secteur recherché
              </span>
              <input
                type="text"
                name="citySector"
                placeholder="Marrakech, Casablanca…"
                className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">
                  Budget indicatif
                </span>
                <select
                  name="budget"
                  defaultValue=""
                  className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  {budgetRanges.map((range) => (
                    <option key={range.label} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">
                  Type de bien
                </span>
                <select
                  name="propertyType"
                  defaultValue=""
                  className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="">Tous types</option>
                  {propertyTypeValues.map((type) => (
                    <option key={type} value={type}>
                      {propertyTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Délai</span>
              <select
                name="timeline"
                defaultValue={timelines[0]}
                className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                {timelines.map((timeline) => (
                  <option key={timeline}>{timeline}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Message</span>
              <textarea
                name="message"
                rows={3}
                placeholder="Décrivez votre projet en quelques mots…"
                className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </label>

            <label className="flex items-start gap-2 text-xs text-anthracite-500">
              <input
                required
                type="checkbox"
                name="confidentiality"
                aria-describedby={state?.fieldErrors?.confidentiality ? "offmarket-confidentiality-error" : undefined}
                className="mt-0.5"
              />
              J&apos;accepte que mes informations soient traitées de manière confidentielle afin d&apos;étudier ma
              demande.
            </label>
            {state?.fieldErrors?.confidentiality && (
              <p id="offmarket-confidentiality-error" role="alert" className={errorClass}>
                {state.fieldErrors.confidentiality}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-full bg-gold-500 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-anthracite-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Envoi en cours…" : "Envoyer ma demande confidentielle"}
            </button>
            <p className="text-center text-[11px] text-anthracite-400">
              Votre demande reste strictement confidentielle.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
