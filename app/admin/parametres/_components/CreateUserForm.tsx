"use client";

import { useActionState, useState } from "react";
import Button from "@/components/Button";
import { Field } from "@/app/admin/biens/_components/FormField";
import { createTeamMember, type TeamFormState } from "@/lib/settings/team-actions";
import { FormMessage, settingsInputClass } from "./form-ui";

export default function CreateUserForm({
  roleOptions,
  passwordMinLength,
}: {
  roleOptions: { value: string; label: string }[];
  passwordMinLength: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (prevState: TeamFormState, formData: FormData) => {
    const result = await createTeamMember(prevState, formData);
    if (result?.success) setOpen(false);
    return result;
  }, undefined);
  const errors = state?.fieldErrors;

  if (!open) {
    return (
      <div className="flex flex-col gap-3">
        {state?.success && <FormMessage success={state.success} />}
        <Button type="button" size="sm" className="w-fit" onClick={() => setOpen(true)}>
          Ajouter un utilisateur
        </Button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-2xl border border-gold-200 bg-white p-6"
    >
      <div className="flex flex-col gap-0.5">
        <h3 className="font-display text-base font-semibold text-anthracite-950">Nouvel utilisateur</h3>
        <p className="text-xs text-anthracite-500">
          Le mot de passe est chiffré (bcrypt) avant stockage et n&apos;est jamais affiché ni journalisé. Transmettez-le à la personne par un canal sûr.
        </p>
      </div>
      <FormMessage error={state?.error} />
      <fieldset disabled={pending} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Field label="Nom" error={errors?.name}>
          <input name="name" defaultValue={state?.values?.name} required maxLength={120} autoComplete="off" className={settingsInputClass} />
        </Field>
        <Field label="E-mail" error={errors?.email}>
          <input type="email" name="email" defaultValue={state?.values?.email} required maxLength={200} autoComplete="off" className={settingsInputClass} />
        </Field>
        <Field label="Rôle" error={errors?.role}>
          <select
            key={state?.values?.role ?? "AGENT"}
            name="role"
            defaultValue={state?.values?.role ?? "AGENT"} className={settingsInputClass}>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="hidden sm:block" />
        <Field label={`Mot de passe (${passwordMinLength} caractères min.)`} error={errors?.password}>
          <input type="password" name="password" required minLength={passwordMinLength} maxLength={128} autoComplete="new-password" className={settingsInputClass} />
        </Field>
        <Field label="Confirmer le mot de passe" error={errors?.passwordConfirm}>
          <input type="password" name="passwordConfirm" required minLength={passwordMinLength} maxLength={128} autoComplete="new-password" className={settingsInputClass} />
        </Field>
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Création…" : "Créer le compte"}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="border border-anthracite-200" onClick={() => setOpen(false)} disabled={pending}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
