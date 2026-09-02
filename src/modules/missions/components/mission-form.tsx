"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MissionActionState } from "../actions/mission.actions";
import { missionStatuses, missionStatusLabels, type MissionInput } from "../schemas/mission.schema";

const control = "mt-2 h-11 w-full rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
export function MissionForm({ action, mission, organizations, projects, defaultProjectId, cancelHref = "/missions" }: { action: (state: MissionActionState, formData: FormData) => Promise<MissionActionState>; mission?: MissionInput; organizations: Array<{ id: string; name: string }>; projects: Array<{ id: string; name: string; organization_id: string }>; defaultProjectId?: string; cancelHref?: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const defaultProject = projects.find((project) => project.id === (mission?.project_id ?? defaultProjectId));
  const [organizationId, setOrganizationId] = useState(mission?.organization_id ?? defaultProject?.organization_id ?? "");
  useEffect(() => { formRef.current?.setAttribute("data-hydrated", "true"); }, []);
  return <form ref={formRef} action={formAction} className="space-y-6" data-hydrated="false" noValidate>
    <label className="block text-sm font-medium">Organisation<select name="organization_id" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} className={control} aria-invalid={Boolean(state.fieldErrors?.organization_id)}><option value="">Sélectionner</option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>
    <label className="block text-sm font-medium">Projet (facultatif)<select name="project_id" defaultValue={mission?.project_id ?? defaultProjectId ?? ""} className={control}><option value="">Aucun projet</option>{projects.filter((project) => project.organization_id === organizationId).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
    <Field label="Titre" name="title" defaultValue={mission?.title ?? ""} error={state.fieldErrors?.title?.[0]} />
    <label className="block text-sm font-medium">Description<textarea name="description" defaultValue={mission?.description ?? ""} maxLength={4000} rows={4} className="mt-2 w-full rounded-md border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" /></label>
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="block text-sm font-medium">Statut<select name="status" defaultValue={mission?.status ?? "draft"} className={control}>{missionStatuses.map((status) => <option key={status} value={status}>{missionStatusLabels[status]}</option>)}</select></label>
      <Field label="Date de début" name="starts_on" type="date" defaultValue={mission?.starts_on ?? ""} />
      <Field label="Date cible" name="target_ends_on" type="date" defaultValue={mission?.target_ends_on ?? ""} error={state.fieldErrors?.target_ends_on?.[0]} />
    </div>
    {state.message ? <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{state.message}</p> : null}
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href={cancelHref} className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>Annuler</Link><Button type="submit" disabled={pending} className="w-full sm:w-auto">{pending ? "Enregistrement…" : "Enregistrer"}</Button></div>
  </form>;
}
function Field({ label, name, type = "text", defaultValue, error }: { label: string; name: string; type?: string; defaultValue: string; error?: string }) { const id = `mission-${name}`; return <label htmlFor={id} className="block text-sm font-medium">{label}<input id={id} name={name} type={type} defaultValue={defaultValue} className={control} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />{error ? <span id={`${id}-error`} className="mt-1 block text-sm text-destructive">{error}</span> : null}</label>; }
