"use client";

import { useState, type FormEvent } from "react";
import { agents, getAgentName } from "@/lib/properties";

type ContactSidebarProps = {
  agentId: string;
  propertyTitle: string;
  propertyReference: string;
};

const timeSlots = [
  "Dès que possible",
  "Cette semaine",
  "Ce week-end",
  "En soirée",
  "À définir ensemble",
];

export default function ContactSidebar({ agentId, propertyTitle, propertyReference }: ContactSidebarProps) {
  const agent = agents.find((entry) => entry.id === agentId);
  const agentName = agent?.name ?? getAgentName(agentId);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <aside className="flex flex-col gap-5 rounded-2xl border border-anthracite-100 bg-white p-6 shadow-sm lg:sticky lg:top-28">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-anthracite-950 font-display text-lg text-gold-400">
          {agentName.charAt(0)}
        </div>
        <div>
          <p className="font-display text-base font-semibold text-anthracite-950">{agentName}</p>
          <p className="text-xs uppercase tracking-wider text-anthracite-400">Conseillère NA Business Africa</p>
        </div>
      </div>

      {agent && (
        <div className="flex flex-col gap-2 border-y border-anthracite-100 py-4 text-sm">
          <a href={`tel:${agent.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-anthracite-700 hover:text-gold-600">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5c0 8.284 6.716 15 15 15l3-3-5-4-2 2a11.05 11.05 0 0 1-6-6l2-2-4-5-3 3Z" />
            </svg>
            {agent.phone}
          </a>
          <a
            href={`https://wa.me/${agent.phone.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-anthracite-700 hover:text-gold-600"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 20l1.4-4.2A8 8 0 1 1 9 18.5L4 20Z" />
            </svg>
            WhatsApp
          </a>
        </div>
      )}

      {submitted ? (
        <div className="rounded-xl border border-gold-300 bg-gold-200/30 p-5 text-center">
          <p className="font-display text-sm font-semibold text-anthracite-950">Merci pour votre demande</p>
          <p className="mt-2 text-xs leading-relaxed text-anthracite-600">
            Votre demande est traitée de manière confidentielle. {agentName.split(" ")[0]} vous recontactera très
            prochainement.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Nom complet</span>
            <input
              required
              type="text"
              name="name"
              className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Téléphone</span>
            <input
              required
              type="tel"
              name="phone"
              className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Email</span>
            <input
              required
              type="email"
              name="email"
              className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Créneau souhaité</span>
            <select
              name="timeSlot"
              className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              {timeSlots.map((slot) => (
                <option key={slot}>{slot}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">Message</span>
            <textarea
              required
              name="message"
              rows={3}
              defaultValue={`Bonjour, je souhaite être recontacté(e) au sujet du bien « ${propertyTitle} » (réf. ${propertyReference}).`}
              className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </label>
          <label className="flex items-start gap-2 text-xs text-anthracite-500">
            <input required type="checkbox" name="confidentiality" className="mt-0.5" />
            J&apos;accepte que mes données soient utilisées pour être recontacté(e) au sujet de ce bien.
          </label>
          <button
            type="submit"
            className="mt-1 rounded-full bg-gold-500 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-anthracite-950 transition-colors hover:bg-gold-400"
          >
            Demander un rendez-vous
          </button>
          <p className="text-center text-[11px] text-anthracite-400">
            Votre demande est traitée de manière confidentielle.
          </p>
        </form>
      )}
    </aside>
  );
}
