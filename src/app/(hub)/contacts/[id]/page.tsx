import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, Check, Pencil } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { cn } from "@/lib/utils";
import { archiveContactAction, completeFollowUpAction, createInteractionAction } from "@/modules/contacts/actions/contact.actions";
import { InteractionForm } from "@/modules/contacts/components/interaction-form";
import { interactionKindLabels } from "@/modules/contacts/schemas/contact.schema";
import { getContact } from "@/modules/contacts/services/contact.service";
import { MessageSquareText } from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" });
const dayFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Europe/Paris" });

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const workspace = await getActiveWorkspace(); const contact = await getContact(workspace.id, id); if (!contact) notFound();
  const archiveAction = archiveContactAction.bind(null, contact.id);
  const interactionAction = createInteractionAction.bind(null, contact.id);
  const openFollowUp = contact.interactions.filter((item) => item.follow_up_label && !item.follow_up_completed_at).sort((a, b) => (a.follow_up_on ?? "9999").localeCompare(b.follow_up_on ?? "9999"))[0];
  const linkedOrganizations = contact.contact_organizations.filter((link) => link.organization).map((link) => ({ id: link.organization!.id, name: link.organization!.name }));
  return <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-4xl space-y-6 px-4 py-7 outline-none sm:px-6 sm:py-9"><div><Link href="/contacts" className="text-sm font-medium text-primary hover:underline">← Contacts</Link><h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{contact.display_name}</h1><p className="mt-1 text-sm text-muted-foreground">{contact.archived_at ? "Contact archivé" : contact.category ?? "Contact actif"}</p></div>
    {openFollowUp ? <Card className="border-primary/30 bg-primary/5"><CardHeader><CardTitle>Prochaine action</CardTitle><CardDescription>{openFollowUp.follow_up_on ? `Prévue le ${dayFormatter.format(new Date(`${openFollowUp.follow_up_on}T12:00:00Z`))}` : "Sans échéance"}</CardDescription></CardHeader><CardContent><p>{openFollowUp.follow_up_label}</p><form action={completeFollowUpAction.bind(null, contact.id, openFollowUp.id)}><Button type="submit" variant="outline"><Check aria-hidden="true" className="size-4" /> Marquer comme réalisée</Button></form></CardContent></Card> : null}
    <Card><CardHeader><CardTitle>Informations</CardTitle></CardHeader><CardContent><dl className="grid gap-4 sm:grid-cols-2"><Info label="E-mail" value={contact.primary_email} /><Info label="Téléphone" value={contact.primary_phone} /><Info label="Prénom" value={contact.first_name} /><Info label="Nom" value={contact.last_name} /></dl>{contact.contact_organizations.length ? <ul className="mt-5 grid gap-2" aria-label="Organisations liées">{contact.contact_organizations.map((link) => <li key={link.organization_id} className="rounded-lg border px-3 py-2 text-sm"><span className="font-medium">{link.organization?.name ?? "Organisation archivée"}</span>{link.job_title || link.role_label ? <span className="text-muted-foreground"> — {[link.job_title, link.role_label].filter(Boolean).join(" · ")}</span> : null}{link.is_primary ? <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Principale</span> : null}</li>)}</ul> : <p className="mt-5 text-sm text-muted-foreground">Aucune organisation liée.</p>}{contact.notes ? <p className="mt-5 whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">{contact.notes}</p> : null}</CardContent></Card>
    <div className="flex flex-col gap-3 sm:flex-row"><Link href={`/contacts/${contact.id}/edit`} className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}><Pencil aria-hidden="true" className="size-4" /> Modifier</Link>{!contact.archived_at ? <form action={archiveAction}><Button type="submit" variant="destructive" className="w-full sm:w-auto"><Archive aria-hidden="true" className="size-4" /> Archiver</Button></form> : null}</div>
    {!contact.archived_at ? <Card><CardHeader><CardTitle>Consigner un échange</CardTitle><CardDescription>Historique manuel uniquement. Aucun message n’est envoyé.</CardDescription></CardHeader><CardContent><InteractionForm action={interactionAction} organizations={linkedOrganizations} /></CardContent></Card> : null}
    <Card><CardHeader><CardTitle>Historique</CardTitle><CardDescription>Échanges manuels, du plus récent au plus ancien.</CardDescription></CardHeader><CardContent>{contact.interactions.length ? <ol className="space-y-4">{contact.interactions.map((interaction) => <li key={interaction.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium">{interactionKindLabels[interaction.kind]}</span><time dateTime={interaction.occurred_at} className="text-xs text-muted-foreground">{dateFormatter.format(new Date(interaction.occurred_at))}</time></div><p className="mt-2 whitespace-pre-wrap text-sm">{interaction.summary}</p>{interaction.follow_up_label ? <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-sm"><span className="font-medium">Relance :</span> {interaction.follow_up_label}{interaction.follow_up_completed_at ? " — réalisée" : interaction.follow_up_on ? ` — ${interaction.follow_up_on}` : ""}</p> : null}</li>)}</ol> : <EmptyState icon={MessageSquareText} title="Aucun échange enregistré" description="Ajoutez le premier échange manuel pour commencer l’historique." className="min-h-44" />}</CardContent></Card>
  </main>;
}

function Info({ label, value }: { label: string; value: string | null }) { return <div><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value ?? "Non renseigné"}</dd></div>; }
