"use client";

import { useActionState } from "react";
import { submitContactRequest } from "@/lib/crm/public-request-actions";
import HoneypotField from "@/components/HoneypotField";

const inputClass =
  "rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500";
const labelClass = "text-xs font-semibold uppercase tracking-wider text-anthracite-500";
const errorClass = "text-xs text-red-600";

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactRequest, undefined);

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-gold-300 bg-gold-200/30 p-8 text-center">
        <p className="font-display text-lg font-semibold text-anthracite-950">
          Votre demande a bien été reçue.
        </p>
        <p className="mt-2 text-sm text-anthracite-600">
          Notre équipe vous recontactera rapidement.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5 rounded-2xl border border-anthracite-100 bg-white p-8 shadow-sm">
      <HoneypotField />

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Nom complet</span>
          <input
            required
            type="text"
            name="fullName"
            autoComplete="name"
            aria-describedby={state?.fieldErrors?.fullName ? "contact-fullName-error" : undefined}
            className={inputClass}
          />
          {state?.fieldErrors?.fullName && (
            <p id="contact-fullName-error" role="alert" className={errorClass}>
              {state.fieldErrors.fullName}
            </p>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Email</span>
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            aria-describedby={state?.fieldErrors?.email ? "contact-email-error" : undefined}
            className={inputClass}
          />
          {state?.fieldErrors?.email && (
            <p id="contact-email-error" role="alert" className={errorClass}>
              {state.fieldErrors.email}
            </p>
          )}
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Téléphone</span>
          <input
            required
            type="tel"
            name="phone"
            autoComplete="tel"
            aria-describedby={state?.fieldErrors?.phone ? "contact-phone-error" : undefined}
            className={inputClass}
          />
          {state?.fieldErrors?.phone && (
            <p id="contact-phone-error" role="alert" className={errorClass}>
              {state.fieldErrors.phone}
            </p>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Sujet</span>
          <select name="subject" defaultValue="autre" className={inputClass}>
            <option value="acheter">Acheter un bien</option>
            <option value="vendre">Vendre un bien</option>
            <option value="investir">Investir</option>
            <option value="off-market">Accès off-market</option>
            <option value="autre">Autre demande</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Message</span>
        <textarea
          required
          name="message"
          rows={5}
          aria-describedby={state?.fieldErrors?.message ? "contact-message-error" : undefined}
          className={inputClass}
        />
        {state?.fieldErrors?.message && (
          <p id="contact-message-error" role="alert" className={errorClass}>
            {state.fieldErrors.message}
          </p>
        )}
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-gold-500 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-anthracite-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Envoi en cours…" : "Envoyer le message"}
      </button>
    </form>
  );
}
