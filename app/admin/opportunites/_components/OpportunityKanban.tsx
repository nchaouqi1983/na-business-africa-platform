"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeOpportunityStage } from "@/lib/crm/opportunity-actions";
import {
  opportunityStageValues,
  opportunityStageLabels,
  opportunityLossReasonOptions,
  isClosedStage,
  type OpportunityStageValue,
} from "@/lib/crm/opportunity-rules";
import { Field, inputClass } from "@/app/admin/biens/_components/FormField";
import Button from "@/components/Button";

export type KanbanCard = {
  id: string;
  reference: string;
  title: string;
  stage: OpportunityStageValue;
  prospectLabel: string;
  propertyLabel: string | null;
  propertyAlert: string | null;
  estimatedAmount: number | null;
  currency: string;
  probability: number;
  expectedCloseDate: string | null;
  assignee: string | null;
  canEdit: boolean;
};

type PendingClose = { card: KanbanCard; toStage: "GAGNEE" | "PERDUE" };

const amountFormatter = new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

function formatAmount(value: number | null, currency: string): string {
  return value === null ? "—" : `${amountFormatter.format(value)} ${currency}`;
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Pipeline board (phase 6L). A card never moves optimistically: dropping it
 * (or picking a stage in its "Déplacer" select, the keyboard/touch-friendly
 * path) calls changeOpportunityStage, and the board only re-renders from the
 * server once that validated the move. GAGNEE/PERDUE first open a small form
 * for the fields the server requires (final amount + closing date / loss
 * reason). Below `md` the board collapses into a per-stage list — no drag.
 */
export default function OpportunityKanban({ cards, canReopen }: { cards: KanbanCard[]; canReopen: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<OpportunityStageValue | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [pendingClose, setPendingClose] = useState<PendingClose | null>(null);
  const [closeErrors, setCloseErrors] = useState<Record<string, string>>({});

  const byStage = new Map<OpportunityStageValue, KanbanCard[]>(opportunityStageValues.map((stage) => [stage, []]));
  for (const card of cards) byStage.get(card.stage)?.push(card);

  function submitMove(card: KanbanCard, toStage: OpportunityStageValue, extra?: FormData) {
    const formData = extra ?? new FormData();
    formData.set("stage", toStage);
    setMovingId(card.id);
    setMessage(null);
    startTransition(async () => {
      const result = await changeOpportunityStage(card.id, undefined, formData);
      setMovingId(null);
      if (result?.error) {
        if (pendingClose && result.fieldErrors) {
          setCloseErrors(result.fieldErrors);
          return;
        }
        setMessage({ tone: "error", text: `${card.reference} : ${result.error}` });
        return;
      }
      setPendingClose(null);
      setCloseErrors({});
      setMessage({ tone: "success", text: `${card.reference} : ${result?.success ?? "stade mis à jour."}` });
      router.refresh();
    });
  }

  function requestMove(card: KanbanCard, toStage: OpportunityStageValue) {
    if (toStage === card.stage || !card.canEdit) return;
    if (isClosedStage(card.stage) && !canReopen) {
      setMessage({ tone: "error", text: `${card.reference} : opportunité clôturée, seul un administrateur peut la rouvrir.` });
      return;
    }
    if (toStage === "GAGNEE" || toStage === "PERDUE") {
      setCloseErrors({});
      setPendingClose({ card, toStage });
      return;
    }
    submitMove(card, toStage);
  }

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={[
            "rounded-xl px-4 py-3 text-sm",
            message.tone === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800",
          ].join(" ")}
        >
          {message.text}
        </p>
      )}

      {/* Desktop board */}
      <div className="hidden overflow-x-auto pb-4 md:block">
        <div className="flex min-w-max gap-4">
          {opportunityStageValues.map((stage) => {
            const stageCards = byStage.get(stage) ?? [];
            const volume = stageCards.reduce((sum, card) => sum + (card.estimatedAmount ?? 0), 0);
            return (
              <section
                key={stage}
                aria-label={opportunityStageLabels[stage]}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverStage(stage);
                }}
                onDragLeave={() => setDragOverStage((current) => (current === stage ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOverStage(null);
                  const id = event.dataTransfer.getData("text/plain");
                  const card = cards.find((candidate) => candidate.id === id);
                  if (card) requestMove(card, stage);
                }}
                className={[
                  "flex w-72 shrink-0 flex-col gap-3 rounded-2xl border p-3 transition-colors",
                  dragOverStage === stage ? "border-gold-400 bg-gold-200/40" : "border-anthracite-100 bg-anthracite-50/60",
                ].join(" ")}
              >
                <header className="flex items-baseline justify-between gap-2 px-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-anthracite-700">
                    {opportunityStageLabels[stage]} <span className="text-anthracite-400">({stageCards.length})</span>
                  </h3>
                  {!isClosedStage(stage) && volume > 0 && (
                    <span className="text-[11px] text-anthracite-400">{amountFormatter.format(volume)}</span>
                  )}
                </header>
                {stageCards.map((card) => (
                  <OpportunityCard
                    key={card.id}
                    card={card}
                    moving={isPending && movingId === card.id}
                    onMove={(toStage) => requestMove(card, toStage)}
                  />
                ))}
                {stageCards.length === 0 && <p className="px-1 text-xs text-anthracite-300">Aucune opportunité</p>}
              </section>
            );
          })}
        </div>
      </div>

      {/* Mobile: list per stage, no drag */}
      <div className="flex flex-col gap-3 md:hidden">
        {opportunityStageValues.map((stage) => {
          const stageCards = byStage.get(stage) ?? [];
          if (stageCards.length === 0) return null;
          return (
            <details key={stage} open={!isClosedStage(stage)} className="rounded-2xl border border-anthracite-100 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-anthracite-900">
                {opportunityStageLabels[stage]} ({stageCards.length})
              </summary>
              <ul className="mt-3 flex flex-col gap-2">
                {stageCards.map((card) => (
                  <li key={card.id}>
                    <Link href={`/admin/opportunites/${card.id}`} className="flex flex-col gap-1 rounded-xl border border-anthracite-100 p-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gold-600">{card.reference}</span>
                      <span className="text-sm font-medium text-anthracite-900">{card.title}</span>
                      <span className="text-xs text-anthracite-500">
                        {card.prospectLabel}
                        {card.propertyLabel ? ` · ${card.propertyLabel}` : ""}
                      </span>
                      <span className="text-xs text-anthracite-400">
                        {formatAmount(card.estimatedAmount, card.currency)} · {card.probability} %
                        {card.expectedCloseDate ? ` · ${dateFormatter.format(new Date(card.expectedCloseDate))}` : ""}
                      </span>
                      {card.propertyAlert && <span className="text-xs font-medium text-red-600">{card.propertyAlert}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
        {cards.length === 0 && <p className="text-sm text-anthracite-400">Aucune opportunité.</p>}
      </div>

      {pendingClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-anthracite-950/40 p-4" role="dialog" aria-modal="true">
          <form
            className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl"
            onSubmit={(event) => {
              event.preventDefault();
              submitMove(pendingClose.card, pendingClose.toStage, new FormData(event.currentTarget));
            }}
          >
            <h2 className="font-display text-lg font-semibold text-anthracite-950">
              {pendingClose.toStage === "GAGNEE" ? "Marquer comme gagnée" : "Marquer comme perdue"} — {pendingClose.card.reference}
            </h2>
            {pendingClose.toStage === "GAGNEE" ? (
              <>
                <Field label="Montant final du deal" error={closeErrors.finalAmount}>
                  <input
                    type="number"
                    name="finalAmount"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={pendingClose.card.estimatedAmount ?? undefined}
                    className={inputClass}
                  />
                </Field>
                <Field label="Date de clôture" error={closeErrors.closedAt}>
                  <input type="date" name="closedAt" required defaultValue={todayIso()} className={inputClass} />
                </Field>
                <p className="text-xs text-anthracite-500">
                  Aucun dossier de commission n&apos;est créé automatiquement : un administrateur le crée ou le lie depuis la fiche.
                </p>
              </>
            ) : (
              <>
                <Field label="Motif de perte" error={closeErrors.lossReason}>
                  <select name="lossReason" required defaultValue="" className={inputClass}>
                    <option value="" disabled>
                      Choisir un motif…
                    </option>
                    {opportunityLossReasonOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Précision (optionnel)" error={closeErrors.lossNote}>
                  <textarea name="lossNote" rows={2} maxLength={2000} className={inputClass} />
                </Field>
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="border border-anthracite-200 hover:border-gold-500"
                onClick={() => {
                  setPendingClose(null);
                  setCloseErrors({});
                }}
              >
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Validation…" : "Valider"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function OpportunityCard({ card, moving, onMove }: { card: KanbanCard; moving: boolean; onMove: (stage: OpportunityStageValue) => void }) {
  return (
    <article
      draggable={card.canEdit && !moving}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", card.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className={[
        "flex flex-col gap-1.5 rounded-xl border bg-white p-3 text-left shadow-sm",
        card.canEdit ? "cursor-grab active:cursor-grabbing" : "",
        card.propertyAlert ? "border-red-200" : "border-anthracite-100",
        moving ? "opacity-50" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <Link href={`/admin/opportunites/${card.id}`} className="text-[11px] font-semibold uppercase tracking-wider text-gold-600 hover:text-gold-500">
          {card.reference}
        </Link>
        <span className="text-[11px] font-medium text-anthracite-500">{card.probability} %</span>
      </div>
      <Link href={`/admin/opportunites/${card.id}`} className="text-sm font-medium text-anthracite-900 hover:text-gold-600">
        {card.title}
      </Link>
      <span className="text-xs text-anthracite-500">{card.prospectLabel}</span>
      <span className="text-xs text-anthracite-400">{card.propertyLabel ?? "Aucun bien"}</span>
      {card.propertyAlert && <span className="text-xs font-medium text-red-600">{card.propertyAlert}</span>}
      <div className="flex items-center justify-between gap-2 text-xs text-anthracite-600">
        <span className="font-medium">{formatAmount(card.estimatedAmount, card.currency)}</span>
        <span>{card.expectedCloseDate ? dateFormatter.format(new Date(card.expectedCloseDate)) : "—"}</span>
      </div>
      <span className="text-[11px] text-anthracite-400">{card.assignee ?? "Non assignée"}</span>
      {card.canEdit && (
        <label className="mt-1 flex items-center gap-2 text-[11px] text-anthracite-500">
          <span className="sr-only sm:not-sr-only">Déplacer</span>
          <select
            value={card.stage}
            disabled={moving}
            onChange={(event) => onMove(event.target.value as OpportunityStageValue)}
            className="w-full rounded-lg border border-anthracite-200 px-2 py-1 text-[11px] outline-none focus:border-gold-500"
            aria-label={`Changer le stade de ${card.reference}`}
          >
            {opportunityStageValues.map((stage) => (
              <option key={stage} value={stage}>
                {opportunityStageLabels[stage]}
              </option>
            ))}
          </select>
        </label>
      )}
      {moving && <span className="text-[11px] text-anthracite-400">Validation serveur…</span>}
    </article>
  );
}
