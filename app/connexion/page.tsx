import type { Metadata } from "next";
import LoginForm from "./_components/LoginForm";

export const metadata: Metadata = {
  title: "Connexion | NA Business Africa",
  description: "Accès réservé à l'équipe NA Business Africa.",
};

export default function ConnexionPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-2 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
          Back-office
        </span>
        <h1 className="font-display text-3xl font-semibold text-anthracite-950">Connexion</h1>
        <p className="text-sm text-anthracite-500">Réservé à l&apos;équipe NA Business Africa.</p>
      </div>

      <div className="rounded-2xl border border-anthracite-100 p-8 shadow-sm">
        <LoginForm />
      </div>
    </div>
  );
}
