"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import { login, type LoginState } from "@/lib/auth/actions";

const initialState: LoginState = undefined;

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-xl border border-anthracite-200 px-4 py-3 text-sm text-anthracite-900 outline-none transition-colors focus:border-gold-500"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-xl border border-anthracite-200 px-4 py-3 text-sm text-anthracite-900 outline-none transition-colors focus:border-gold-500"
        />
      </div>

      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full justify-center">
        {pending ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}
