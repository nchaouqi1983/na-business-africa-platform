"use client";

import { useActionState, type ReactNode } from "react";
import Button from "@/components/Button";
import { Field } from "@/app/admin/biens/_components/FormField";
import { saveOrganizationSettings } from "@/lib/settings/organization-actions";
import { currencyOptions, languageOptions, timezoneOptions } from "@/lib/settings/organization-schema";
import { FormMessage, settingsInputClass } from "./form-ui";

export type OrganizationSettingsValues = {
  agencyName: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  website: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  defaultLanguage: string;
  timezone: string;
  defaultCurrency: string;
};

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-anthracite-100 pt-6 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-0.5">
        <h3 className="font-display text-base font-semibold text-anthracite-950">{title}</h3>
        <p className="text-xs text-anthracite-500">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default function OrganizationSettingsForm({
  defaultValues,
  readOnly,
}: {
  defaultValues: OrganizationSettingsValues;
  readOnly: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveOrganizationSettings, undefined);
  const errors = state?.fieldErrors;
  const values: OrganizationSettingsValues = { ...defaultValues, ...state?.values };

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FormMessage error={state?.error} success={state?.success} />

      <fieldset disabled={readOnly || pending} className="flex min-w-0 flex-col gap-6">
        <Section title="Identité" description="Nom et signature de l'agence.">
          <Field label="Nom de l'agence" error={errors?.agencyName}>
            <input name="agencyName" defaultValue={values.agencyName} required maxLength={120} className={settingsInputClass} />
          </Field>
          <Field label="Slogan" error={errors?.tagline}>
            <input name="tagline" defaultValue={values.tagline} maxLength={200} className={settingsInputClass} />
          </Field>
        </Section>

        <Section title="Coordonnées" description="Contacts principaux de l'agence.">
          <Field label="E-mail principal" error={errors?.email}>
            <input type="email" name="email" defaultValue={values.email} maxLength={200} className={settingsInputClass} />
          </Field>
          <Field label="Téléphone principal" error={errors?.phone}>
            <input type="tel" name="phone" defaultValue={values.phone} maxLength={30} placeholder="+212 …" className={settingsInputClass} />
          </Field>
          <Field label="WhatsApp" error={errors?.whatsapp}>
            <input type="tel" name="whatsapp" defaultValue={values.whatsapp} maxLength={30} placeholder="+212 …" className={settingsInputClass} />
          </Field>
          <Field label="Site web" error={errors?.website}>
            <input type="url" name="website" defaultValue={values.website} maxLength={300} placeholder="https://" className={settingsInputClass} />
          </Field>
          <Field label="Adresse" error={errors?.address}>
            <input name="address" defaultValue={values.address} maxLength={240} className={settingsInputClass} />
          </Field>
          <Field label="Ville" error={errors?.city}>
            <input name="city" defaultValue={values.city} maxLength={120} className={settingsInputClass} />
          </Field>
        </Section>

        <Section title="Réseaux sociaux" description="Liens complets vers les pages officielles.">
          <Field label="Instagram" error={errors?.instagramUrl}>
            <input type="url" name="instagramUrl" defaultValue={values.instagramUrl} maxLength={300} placeholder="https://instagram.com/…" className={settingsInputClass} />
          </Field>
          <Field label="Facebook" error={errors?.facebookUrl}>
            <input type="url" name="facebookUrl" defaultValue={values.facebookUrl} maxLength={300} placeholder="https://facebook.com/…" className={settingsInputClass} />
          </Field>
          <Field label="LinkedIn" error={errors?.linkedinUrl}>
            <input type="url" name="linkedinUrl" defaultValue={values.linkedinUrl} maxLength={300} placeholder="https://linkedin.com/company/…" className={settingsInputClass} />
          </Field>
        </Section>

        <Section title="Préférences régionales" description="Valeurs par défaut du back-office.">
          <Field label="Langue par défaut" error={errors?.defaultLanguage}>
            <select key={values.defaultLanguage} name="defaultLanguage" defaultValue={values.defaultLanguage} className={settingsInputClass}>
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fuseau horaire" error={errors?.timezone}>
            <select key={values.timezone} name="timezone" defaultValue={values.timezone} className={settingsInputClass}>
              {timezoneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Devise par défaut" error={errors?.defaultCurrency}>
            <select key={values.defaultCurrency} name="defaultCurrency" defaultValue={values.defaultCurrency} className={settingsInputClass}>
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </Section>
      </fieldset>

      {!readOnly && (
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      )}
    </form>
  );
}
