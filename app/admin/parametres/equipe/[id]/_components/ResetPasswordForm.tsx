"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import { Field } from "@/app/admin/biens/_components/FormField";
import { resetTeamMemberPassword } from "@/lib/settings/team-actions";
import { FormMessage, settingsInputClass } from "../../../_components/form-ui";

export default function ResetPasswordForm({ userId, passwordMinLength }: { userId: string; passwordMinLength: number }) {
  const [state, formAction, pending] = useActionState(resetTeamMemberPassword.bind(null, userId), undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormMessage error={state?.error} success={state?.success} />
      <fieldset disabled={pending} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Field label={`Nouveau mot de passe (${passwordMinLength} caractères min.)`} error={state?.fieldErrors?.password}>
          <input type="password" name="password" required minLength={passwordMinLength} maxLength={128} autoComplete="new-password" className={settingsInputClass} />
        </Field>
        <Field label="Confirmer" error={state?.fieldErrors?.passwordConfirm}>
          <input type="password" name="passwordConfirm" required minLength={passwordMinLength} maxLength={128} autoComplete="new-password" className={settingsInputClass} />
        </Field>
      </fieldset>
      <Button type="submit" size="sm" disabled={pending} className="w-fit">
        {pending ? "Enregistrement…" : "Définir le mot de passe"}
      </Button>
    </form>
  );
}
