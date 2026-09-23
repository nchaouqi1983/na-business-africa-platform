"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import { Field } from "@/app/admin/biens/_components/FormField";
import { updateTeamMember } from "@/lib/settings/team-actions";
import { FormMessage, settingsInputClass } from "../../../_components/form-ui";

export default function EditUserForm({
  userId,
  defaultName,
  defaultRole,
  roleOptions,
  roleLocked,
}: {
  userId: string;
  defaultName: string;
  defaultRole: string;
  roleOptions: { value: string; label: string }[];
  /** Own account: the role can't be changed (the server refuses it too). */
  roleLocked: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateTeamMember.bind(null, userId), undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormMessage error={state?.error} success={state?.success} />
      <fieldset disabled={pending} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Field label="Nom" error={state?.fieldErrors?.name}>
          <input name="name" defaultValue={defaultName} required maxLength={120} className={settingsInputClass} />
        </Field>
        <Field label="Rôle" error={state?.fieldErrors?.role}>
          {roleLocked && <input type="hidden" name="role" value={defaultRole} />}
          <select name={roleLocked ? undefined : "role"} defaultValue={defaultRole} disabled={roleLocked} className={settingsInputClass}>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {roleLocked && <span className="text-xs text-anthracite-500">Vous ne pouvez pas modifier votre propre rôle.</span>}
        </Field>
      </fieldset>
      <Button type="submit" size="sm" disabled={pending} className="w-fit">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
