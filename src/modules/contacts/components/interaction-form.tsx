"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ContactActionState } from "../actions/contact.actions";
import { interactionKindLabels, interactionKinds } from "../schemas/contact.schema";

export function InteractionForm({ action, organizations }: { action: (state: ContactActionState, formData: FormData) => Promise<ContactActionState>; organizations: Array<{ id: string; name: string }> }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="grid gap-4" noValidate>
    <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium">Type<select name="kind" defaultValue="email" className="mt-2 h-11 w-full rounded-md border bg-background px-3">{interactionKinds.map((kind) => <option key={kind} value={kind}>{interactionKindLabels[kind]}</option>)}</select></label><label className="space-y-2 text-sm font-medium">Date et heure<input name="occurred_at" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} className="mt-2 h-11 w-full rounded-md border bg-background px-3" /></label></div>
    <label className="space-y-2 text-sm font-medium">Organisation<select name="organization_id" defaultValue="" className="mt-2 h-11 w-full rounded-md border bg-background px-3"><option value="">Aucune</option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>
    <label className="space-y-2 text-sm font-medium">Résumé<textarea name="summary" required maxLength={2000} rows={3} className="mt-2 w-full rounded-md border bg-background px-3 py-2" /></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium">Prochaine action<input name="follow_up_label" maxLength={240} className="mt-2 h-11 w-full rounded-md border bg-background px-3" /></label><label className="space-y-2 text-sm font-medium">Date de relance<input name="follow_up_on" type="date" className="mt-2 h-11 w-full rounded-md border bg-background px-3" /></label></div>
    {state.message ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}<Button type="submit" disabled={pending} className="w-full sm:w-fit">{pending ? "Ajout…" : "Ajouter à l’historique"}</Button>
  </form>;
}
