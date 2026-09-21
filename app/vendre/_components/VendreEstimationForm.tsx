"use client";

import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { getCities, propertyTypeLabels, propertyTypeValues } from "@/lib/properties";

const situations = [
  "Vente immédiate",
  "Dans les prochains mois",
  "En réflexion",
];

const inputClass =
  "rounded-lg border border-anthracite-200 px-3 py-2 text-sm text-anthracite-900 focus:outline-none focus:ring-2 focus:ring-gold-500";
const labelClass = "text-xs font-semibold uppercase tracking-wider text-anthracite-500";

export default function VendreEstimationForm() {
  const citiesListId = useId();
  const [submitted, setSubmitted] = useState(false);
  const [priceMode, setPriceMode] = useState<"advice" | "amount">("advice");
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const cities = getCities();

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    setPhotoNames(files ? Array.from(files).map((file) => file.name) : []);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div id="demande-estimation" className="grid scroll-mt-28 gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
      <div className="flex flex-col gap-4">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
          Demander une estimation
        </span>
        <h2 className="font-display text-2xl font-semibold text-anthracite-950 sm:text-3xl">
          Parlez-nous de votre bien
        </h2>
        <p className="text-sm leading-relaxed text-anthracite-500">
          Plus votre demande est précise, plus le premier avis de Niama pourra être pertinent. Un rendez-vous sur
          place viendra ensuite affiner l&apos;estimation.
        </p>
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">
          Votre demande et les informations relatives à votre bien sont traitées de manière strictement
          confidentielle.
        </p>
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 shadow-sm sm:p-8">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-gold-300 bg-gold-200/30 px-6 py-12 text-center">
            <p className="font-display text-lg font-semibold text-anthracite-950">Merci pour votre demande</p>
            <p className="max-w-sm text-sm leading-relaxed text-anthracite-600">
              Niama va étudier votre bien personnellement et reviendra vers vous dans les meilleurs délais.
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">
              Votre demande reste strictement confidentielle.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Nom complet</span>
                <input required type="text" name="fullName" autoComplete="name" className={inputClass} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Téléphone</span>
                <input required type="tel" name="phone" autoComplete="tel" className={inputClass} />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className={labelClass}>Email</span>
              <input required type="email" name="email" autoComplete="email" className={inputClass} />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Type de bien</span>
                <select required name="propertyType" defaultValue="" className={inputClass}>
                  <option value="" disabled>
                    Sélectionner
                  </option>
                  {propertyTypeValues.map((type) => (
                    <option key={type} value={type}>
                      {propertyTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Ville</span>
                <input
                  required
                  type="text"
                  name="city"
                  list={citiesListId}
                  placeholder="Marrakech, Casablanca…"
                  className={inputClass}
                />
                <datalist id={citiesListId}>
                  {cities.map((city) => (
                    <option key={city.name} value={city.name} />
                  ))}
                </datalist>
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className={labelClass}>Quartier / secteur</span>
              <input type="text" name="district" placeholder="Palmeraie, Gauthier…" className={inputClass} />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Surface approximative</span>
                <input type="text" name="surface" placeholder="Ex : 350 m²" className={inputClass} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Nombre de chambres (optionnel)</span>
                <input type="number" min={0} name="rooms" className={inputClass} />
              </label>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className={labelClass}>Prix souhaité</legend>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-sm text-anthracite-700">
                  <input
                    type="radio"
                    name="priceMode"
                    value="advice"
                    checked={priceMode === "advice"}
                    onChange={() => setPriceMode("advice")}
                  />
                  Je souhaite être conseillé
                </label>
                <label className="flex items-center gap-2 text-sm text-anthracite-700">
                  <input
                    type="radio"
                    name="priceMode"
                    value="amount"
                    checked={priceMode === "amount"}
                    onChange={() => setPriceMode("amount")}
                  />
                  J&apos;ai un prix en tête
                </label>
              </div>
              {priceMode === "amount" ? (
                <input
                  type="text"
                  name="desiredPrice"
                  placeholder="Ex : 4 500 000 MAD"
                  className={`${inputClass} sm:max-w-xs`}
                />
              ) : null}
            </fieldset>

            <label className="flex flex-col gap-1">
              <span className={labelClass}>Votre situation</span>
              <select name="situation" defaultValue={situations[2]} className={inputClass}>
                {situations.map((situation) => (
                  <option key={situation}>{situation}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className={labelClass}>Message</span>
              <textarea
                name="message"
                rows={3}
                placeholder="Décrivez votre bien, son histoire, ce qui le distingue…"
                className={inputClass}
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className={labelClass}>Photos du bien (optionnel)</span>
              <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-anthracite-300 px-4 py-2.5 text-sm text-anthracite-600 transition-colors hover:border-gold-500 hover:text-gold-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L7 9m5-5 5 5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                </svg>
                Joindre des photos
                <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="sr-only" />
              </label>
              {photoNames.length > 0 ? (
                <ul className="flex flex-col gap-1 text-xs text-anthracite-500">
                  {photoNames.map((name) => (
                    <li key={name} className="truncate">
                      {name}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="text-xs text-anthracite-400">
                Aperçu local uniquement : les photos ne sont pas transmises depuis ce formulaire. Niama vous
                proposera un moyen sécurisé de les partager lors de votre échange.
              </p>
            </div>

            <label className="flex items-start gap-2 text-xs text-anthracite-500">
              <input required type="checkbox" name="confidentiality" className="mt-0.5" />
              Votre demande et les informations relatives à votre bien sont traitées de manière strictement
              confidentielle.
            </label>

            <button
              type="submit"
              className="mt-1 rounded-full bg-gold-500 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-anthracite-950 transition-colors hover:bg-gold-400"
            >
              Envoyer ma demande d&apos;estimation
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
