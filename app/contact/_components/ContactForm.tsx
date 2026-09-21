"use client";

import { useState, type FormEvent } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-gold-300 bg-gold-200/30 p-8 text-center">
        <p className="font-display text-lg font-semibold text-anthracite-950">
          Merci pour votre message
        </p>
        <p className="mt-2 text-sm text-anthracite-600">
          Un conseiller NA Business Africa vous recontactera très prochainement.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-anthracite-100 bg-white p-8 shadow-sm">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">
            Nom complet
          </span>
          <input
            required
            type="text"
            name="name"
            className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">
            Email
          </span>
          <input
            required
            type="email"
            name="email"
            className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">
          Sujet
        </span>
        <select
          name="subject"
          className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
        >
          <option>Acheter un bien</option>
          <option>Vendre un bien</option>
          <option>Investir</option>
          <option>Accès off-market</option>
          <option>Autre demande</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">
          Message
        </span>
        <textarea
          required
          name="message"
          rows={5}
          className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </label>

      <button
        type="submit"
        className="w-fit rounded-full bg-gold-500 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-anthracite-950 transition-colors hover:bg-gold-400"
      >
        Envoyer le message
      </button>
    </form>
  );
}
