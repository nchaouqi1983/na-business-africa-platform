import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireAdminUser } from "@/lib/auth/dal";
import { roleLabels } from "@/lib/auth/roles";
import { formatDateTime } from "@/lib/admin/format";
import { Role } from "@/lib/generated/prisma/enums";
import { canAssignRole, canManageTeam, canManageUserAccount } from "@/lib/settings/permissions";
import { countActiveSessions, getTeamMember } from "@/lib/settings/team-queries";
import { PASSWORD_MIN_LENGTH } from "@/lib/settings/team-schema";
import { StatusPill } from "../../_components/TeamPanel";
import EditUserForm from "./_components/EditUserForm";
import UserStatusForm from "./_components/UserStatusForm";
import ResetPasswordForm from "./_components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Utilisateur | NA Business Africa",
};

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">{title}</h2>
        <p className="text-sm text-anthracite-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Denied({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-anthracite-100 bg-white p-10 text-center">
      <h1 className="font-display text-xl font-semibold text-anthracite-950">Accès non autorisé</h1>
      <p className="text-sm text-anthracite-500">{message}</p>
      <Link href="/admin/parametres?onglet=equipe" className="text-xs font-semibold uppercase tracking-wider text-gold-700">
        ← Retour à l&apos;équipe
      </Link>
    </div>
  );
}

export default async function TeamMemberPage({ params }: PageProps<"/admin/parametres/equipe/[id]">) {
  const actor = await requireAdminUser();
  if (!canManageTeam(actor.role)) {
    return <Denied message="La gestion de l'équipe est réservée aux super administrateurs et administrateurs." />;
  }

  const { id } = await params;
  const member = await getTeamMember(id);
  if (!member) notFound();

  if (!canManageUserAccount(actor.role, member.role)) {
    return <Denied message="Seul un super administrateur peut gérer un compte super administrateur." />;
  }

  const isSelf = member.id === actor.id;
  const sessions = await countActiveSessions(member.id);
  const roleOptions = Object.values(Role)
    .filter((role) => role === member.role || canAssignRole(actor.role, role))
    .map((role) => ({ value: role, label: roleLabels[role] }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link href="/admin/parametres?onglet=equipe" className="w-fit text-xs font-semibold uppercase tracking-wider text-anthracite-500 hover:text-gold-700">
          ← Équipe & accès
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="min-w-0 break-words font-display text-3xl font-semibold text-anthracite-950">{member.name ?? member.email}</h1>
          <StatusPill isActive={member.isActive} />
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-anthracite-500">
          <div className="flex min-w-0 gap-1.5">
            <dt className="sr-only">E-mail</dt>
            <dd className="break-all">{member.email}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Rôle :</dt>
            <dd className="text-anthracite-800">{roleLabels[member.role]}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Créé le</dt>
            <dd className="text-anthracite-800">{formatDateTime(member.createdAt)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Sessions actives :</dt>
            <dd className="text-anthracite-800">{sessions}</dd>
          </div>
          {member.deactivatedAt && (
            <div className="flex gap-1.5">
              <dt>Désactivé le</dt>
              <dd className="text-anthracite-800">{formatDateTime(member.deactivatedAt)}</dd>
            </div>
          )}
        </dl>
      </div>

      <Card title="Profil et rôle" description="L'adresse e-mail sert d'identifiant de connexion et n'est pas modifiable ici.">
        <EditUserForm
          userId={member.id}
          defaultName={member.name ?? ""}
          defaultRole={member.role}
          roleOptions={roleOptions}
          roleLocked={isSelf}
        />
      </Card>

      <Card
        title="Mot de passe"
        description="Définit un nouveau mot de passe (chiffré avec bcrypt, jamais affiché ni journalisé). Les autres sessions ouvertes du compte sont fermées."
      >
        <ResetPasswordForm userId={member.id} passwordMinLength={PASSWORD_MIN_LENGTH} />
      </Card>

      <Card
        title="Statut du compte"
        description={
          member.isActive
            ? "Désactiver empêche toute connexion et ferme immédiatement les sessions en cours. Le compte et son historique sont conservés."
            : "Le compte est désactivé : il ne peut pas se connecter. Le réactiver lui rend l'accès avec son mot de passe actuel."
        }
      >
        <UserStatusForm
          userId={member.id}
          isActive={member.isActive}
          disabledReason={isSelf && member.isActive ? "Vous ne pouvez pas désactiver votre propre compte." : undefined}
        />
      </Card>
    </div>
  );
}
