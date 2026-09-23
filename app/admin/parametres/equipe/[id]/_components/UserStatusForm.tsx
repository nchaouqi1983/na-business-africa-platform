"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import { setTeamMemberActive } from "@/lib/settings/team-actions";
import { FormMessage } from "../../../_components/form-ui";

export default function UserStatusForm({
  userId,
  isActive,
  disabledReason,
}: {
  userId: string;
  isActive: boolean;
  /** Set when the action is known to be refused (e.g. own account) — the server re-checks regardless. */
  disabledReason?: string;
}) {
  const [state, formAction, pending] = useActionState(setTeamMemberActive.bind(null, userId, !isActive), undefined);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (isActive && !window.confirm("Désactiver ce compte ? Il ne pourra plus se connecter et ses sessions seront fermées.")) {
          event.preventDefault();
        }
      }}
      className="flex flex-col gap-3"
    >
      <FormMessage error={state?.error} success={state?.success} />
      <Button
        type="submit"
        size="sm"
        variant={isActive ? "ghost" : "primary"}
        disabled={pending || Boolean(disabledReason)}
        className={isActive ? "w-fit border border-red-200 text-red-700 hover:border-red-400 hover:text-red-800" : "w-fit"}
      >
        {pending ? "Enregistrement…" : isActive ? "Désactiver le compte" : "Réactiver le compte"}
      </Button>
      {disabledReason && <p className="text-xs text-anthracite-500">{disabledReason}</p>}
    </form>
  );
}
