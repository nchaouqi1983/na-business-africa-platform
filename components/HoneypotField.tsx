"use client";

import { useState } from "react";

/**
 * Invisible anti-spam trap for public forms (phase 6G2): a field a human
 * never sees or reaches by tab, but that generic bots filling every input
 * tend to fill anyway. Paired with `formStartedAt`, checked server-side by
 * lib/crm/public-request-rate-limit.ts — never rely on this alone.
 *
 * `display:none`/`visibility:hidden` are skipped on purpose: some bots
 * ignore those. Off-screen positioning plus `aria-hidden` + un-tabbable
 * keeps it out of a real (sighted or screen-reader) visitor's way instead.
 */
export default function HoneypotField() {
  const [formStartedAt] = useState(() => String(Date.now()));

  return (
    <div aria-hidden="true" className="pointer-events-none h-0 w-0 overflow-hidden opacity-0">
      <label>
        Ne pas remplir ce champ
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <input type="hidden" name="formStartedAt" value={formStartedAt} />
    </div>
  );
}
