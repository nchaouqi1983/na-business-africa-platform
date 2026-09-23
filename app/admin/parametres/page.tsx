import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/auth/dal";
import { roleLabels } from "@/lib/auth/roles";
import { formatDateTime } from "@/lib/admin/format";
import { canEditOrganizationSettings, canManageTeam } from "@/lib/settings/permissions";
import { getOrganizationSettings } from "@/lib/settings/organization-queries";
import SettingsTabs, { settingsTabs, type SettingsTabId } from "./_components/SettingsTabs";
import OrganizationSettingsForm from "./_components/OrganizationSettingsForm";
import TeamPanel from "./_components/TeamPanel";
import ReferentialsPanel from "./_components/ReferentialsPanel";

export const metadata: Metadata = {
  title: "Paramètres | NA Business Africa",
};

function LimitedAccess({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-anthracite-100 bg-anthracite-50 px-4 py-3 text-sm text-anthracite-600" role="note">
      {message}
    </p>
  );
}

export default async function SettingsPage({ searchParams }: PageProps<"/admin/parametres">) {
  const user = await requireAdminUser();
  const sp = await searchParams;
  const requested = Array.isArray(sp.onglet) ? sp.onglet[0] : sp.onglet;
  const tab: SettingsTabId = settingsTabs.some((item) => item.id === requested) ? (requested as SettingsTabId) : "agence";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Administration</span>
        <h1 className="font-display text-3xl font-semibold text-anthracite-950">Paramètres</h1>
      </div>

      <SettingsTabs active={tab} />

      {tab === "agence" && <AgencyTab role={user.role} />}

      {tab === "equipe" &&
        (canManageTeam(user.role) ? (
          <TeamPanel actor={user} />
        ) : (
          <LimitedAccess
            message={`Accès limité : la gestion de l'équipe est réservée aux super administrateurs et administrateurs. Votre rôle actuel : ${roleLabels[user.role]}.`}
          />
        ))}

      {tab === "referentiels" && <ReferentialsPanel />}
    </div>
  );
}

async function AgencyTab({ role }: { role: Parameters<typeof canEditOrganizationSettings>[0] }) {
  const settings = await getOrganizationSettings();
  const readOnly = !canEditOrganizationSettings(role);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-xl font-semibold text-anthracite-950">Informations de l&apos;agence</h2>
        <p className="text-sm text-anthracite-500">
          {settings.updatedAt ? `Dernière mise à jour le ${formatDateTime(settings.updatedAt)}.` : "Valeurs par défaut — jamais enregistrées."}{" "}
          Ces informations sont conservées pour le back-office ; le site public n&apos;est pas encore branché dessus.
        </p>
      </div>
      {readOnly && (
        <LimitedAccess message="Lecture seule : seuls les super administrateurs et administrateurs peuvent modifier ces informations." />
      )}
      <div className="rounded-2xl border border-anthracite-100 bg-white p-6 lg:p-8">
        <OrganizationSettingsForm
          readOnly={readOnly}
          defaultValues={{
            agencyName: settings.agencyName,
            tagline: settings.tagline ?? "",
            email: settings.email ?? "",
            phone: settings.phone ?? "",
            whatsapp: settings.whatsapp ?? "",
            address: settings.address ?? "",
            city: settings.city ?? "",
            website: settings.website ?? "",
            instagramUrl: settings.instagramUrl ?? "",
            facebookUrl: settings.facebookUrl ?? "",
            linkedinUrl: settings.linkedinUrl ?? "",
            defaultLanguage: settings.defaultLanguage,
            timezone: settings.timezone,
            defaultCurrency: settings.defaultCurrency,
          }}
        />
      </div>
    </div>
  );
}
