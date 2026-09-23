import Link from "next/link";
import { roleLabels } from "@/lib/auth/roles";
import type { AuthenticatedUser } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/admin/format";
import { canAssignRole, canManageUserAccount } from "@/lib/settings/permissions";
import { listTeamMembers } from "@/lib/settings/team-queries";
import { PASSWORD_MIN_LENGTH } from "@/lib/settings/team-schema";
import { Role } from "@/lib/generated/prisma/enums";
import CreateUserForm from "./CreateUserForm";

export function StatusPill({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Actif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-anthracite-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-anthracite-600">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-anthracite-400" />
      Désactivé
    </span>
  );
}

/** Callers must have checked canManageTeam(actor.role) first. */
export default async function TeamPanel({ actor }: { actor: AuthenticatedUser }) {
  const members = await listTeamMembers();
  const activeCount = members.filter((member) => member.isActive).length;
  const roleOptions = Object.values(Role)
    .filter((role) => canAssignRole(actor.role, role))
    .map((role) => ({ value: role, label: roleLabels[role] }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-xl font-semibold text-anthracite-950">Équipe & accès</h2>
          <p className="text-sm text-anthracite-500">
            {members.length} compte{members.length > 1 ? "s" : ""} · {activeCount} actif{activeCount > 1 ? "s" : ""}. Aucun compte n&apos;est
            supprimé : un compte désactivé ne peut plus se connecter et ses sessions sont fermées.
          </p>
        </div>
      </div>

      <CreateUserForm roleOptions={roleOptions} passwordMinLength={PASSWORD_MIN_LENGTH} />

      <div className="relative overflow-x-auto rounded-2xl border border-anthracite-100 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-anthracite-100 bg-anthracite-50/60 text-[11px] uppercase tracking-wider text-anthracite-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Nom</th>
              <th className="px-4 py-3 font-semibold">E-mail</th>
              <th className="px-4 py-3 font-semibold">Rôle</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold">Créé le</th>
              <th className="px-4 py-3 font-semibold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-anthracite-100">
            {members.map((member) => {
              const manageable = canManageUserAccount(actor.role, member.role);
              return (
                <tr key={member.id} className={member.isActive ? "" : "bg-anthracite-50/40"}>
                  <td className="px-4 py-3 font-medium text-anthracite-950">
                    {member.name ?? "—"}
                    {member.id === actor.id && <span className="ml-2 text-xs font-normal text-gold-600">(vous)</span>}
                  </td>
                  <td className="px-4 py-3 text-anthracite-600">{member.email}</td>
                  <td className="px-4 py-3 text-anthracite-700">{roleLabels[member.role]}</td>
                  <td className="px-4 py-3">
                    <StatusPill isActive={member.isActive} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-anthracite-500">{formatDateTime(member.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {manageable ? (
                      <Link
                        href={`/admin/parametres/equipe/${member.id}`}
                        className="text-xs font-semibold uppercase tracking-wider text-gold-700 hover:text-anthracite-950"
                      >
                        Gérer
                      </Link>
                    ) : (
                      <span className="text-xs text-anthracite-500" title="Seul un super administrateur peut gérer ce compte.">
                        Réservé super admin
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
