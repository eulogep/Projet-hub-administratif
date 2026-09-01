"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContactActionState } from "../actions/contact.actions";
import type { ContactInput } from "../schemas/contact.schema";

type OrganizationOption = { id: string; name: string };
type ExistingLink = {
  organization_id: string;
  job_title: string | null;
  role_label: string | null;
  is_primary: boolean;
};

const inputClass = "h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function ContactForm({
  action,
  contact,
  organizations,
  existingLinks = [],
  cancelHref = "/contacts",
}: {
  action: (state: ContactActionState, formData: FormData) => Promise<ContactActionState>;
  contact?: ContactInput;
  organizations: OrganizationOption[];
  existingLinks?: ExistingLink[];
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    formRef.current?.setAttribute("data-hydrated", "true");
  }, []);

  const formContact = state.submitted?.contact ?? contact;
  const formLinks = state.submitted?.links ?? existingLinks;
  const linkByOrganization = new Map(formLinks.map((link) => [link.organization_id, link]));

  return (
    <form ref={formRef} action={formAction} className="space-y-7" data-hydrated="false" noValidate>
      <fieldset key={state.submitted ? "submitted-contact" : "initial-contact"} className="grid gap-5 sm:grid-cols-2">
        <legend className="sr-only">Identité</legend>
        <Field label="Prénom" name="first_name" defaultValue={formContact?.first_name ?? ""} error={state.fieldErrors?.first_name?.[0]} />
        <Field label="Nom" name="last_name" defaultValue={formContact?.last_name ?? ""} error={state.fieldErrors?.last_name?.[0]} />
        <div className="sm:col-span-2">
          <Field label="Nom affiché" name="display_name" defaultValue={formContact?.display_name ?? ""} error={state.fieldErrors?.display_name?.[0]} hint="Facultatif si le prénom ou le nom est renseigné." />
        </div>
        <Field label="Adresse e-mail" name="primary_email" type="email" defaultValue={formContact?.primary_email ?? ""} error={state.fieldErrors?.primary_email?.[0]} />
        <Field label="Téléphone" name="primary_phone" type="tel" defaultValue={formContact?.primary_phone ?? ""} error={state.fieldErrors?.primary_phone?.[0]} />
        <div className="sm:col-span-2"><Field label="Catégorie" name="category" defaultValue={formContact?.category ?? ""} error={state.fieldErrors?.category?.[0]} /></div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="contact-notes" className="text-sm font-medium">Notes minimales</label>
          <textarea id="contact-notes" name="notes" maxLength={4000} rows={4} defaultValue={formContact?.notes ?? ""} className="w-full rounded-md border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          <p className="text-xs text-muted-foreground">N’ajoutez pas de données sensibles ou de dossiers concernant des tiers.</p>
        </div>
      </fieldset>

      <fieldset key={state.submitted ? "submitted-links" : "initial-links"} className="space-y-4">
        <legend className="text-base font-semibold">Rattachements aux organisations</legend>
        <p className="text-sm text-muted-foreground">Sélectionnez uniquement les organisations utiles à ce contact.</p>
        {organizations.length ? organizations.map((organization) => {
          const link = linkByOrganization.get(organization.id);
          return (
            <div key={organization.id} className="rounded-xl border p-4">
              <label className="flex min-h-8 items-center gap-3 font-medium">
                <input type="checkbox" name="organization_ids" value={organization.id} defaultChecked={Boolean(link)} className="size-4 accent-primary" />
                {organization.name}
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Fonction" name={`job_title_${organization.id}`} defaultValue={link?.job_title ?? ""} />
                <Field label="Rôle contextuel" name={`role_label_${organization.id}`} defaultValue={link?.role_label ?? ""} />
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="radio" name="primary_organization_id" value={organization.id} defaultChecked={link?.is_primary} className="size-4 accent-primary" />
                Organisation principale
              </label>
            </div>
          );
        }) : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Aucune organisation active. Le contact peut être enregistré sans rattachement.</p>}
      </fieldset>

      {state.duplicates?.length ? (
        <section role="alert" className="rounded-xl border border-warning/50 bg-warning/10 p-4">
          <h2 className="font-semibold">Doublons potentiels</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {state.duplicates.map((duplicate) => <li key={duplicate.id}>{duplicate.display_name}{duplicate.primary_email ? ` — ${duplicate.primary_email}` : ""}</li>)}
          </ul>
          <p className="mt-3 text-sm">Vérifiez la liste, puis confirmez à nouveau pour enregistrer malgré cet avertissement.</p>
          <input type="hidden" name="confirm_duplicates" value="yes" />
        </section>
      ) : null}
      {state.message ? <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{state.message}</p> : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>Annuler</Link>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">{pending ? "Enregistrement…" : state.duplicates?.length ? "Confirmer l’enregistrement" : "Enregistrer"}</Button>
      </div>
    </form>
  );
}

function Field({ label, name, type = "text", defaultValue, error, hint }: { label: string; name: string; type?: string; defaultValue?: string; error?: string; hint?: string }) {
  const id = `contact-${name}`;
  return <div className="space-y-2"><label htmlFor={id} className="text-sm font-medium">{label}</label><input id={id} name={name} type={type} defaultValue={defaultValue} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} className={inputClass} />{error ? <p id={`${id}-error`} className="text-sm text-destructive">{error}</p> : hint ? <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p> : null}</div>;
}
