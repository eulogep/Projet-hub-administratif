import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { cn } from "@/lib/utils";
import { ContactList } from "@/modules/contacts/components/contact-list";
import { contactStatusSchema } from "@/modules/contacts/schemas/contact.schema";
import { listContacts } from "@/modules/contacts/services/contact.service";

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ status?: string | string[]; q?: string | string[] }> }) {
  const params = await searchParams;
  const parsedStatus = contactStatusSchema.safeParse(params.status);
  const status = parsedStatus.success ? parsedStatus.data : "active";
  const search = typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const workspace = await getActiveWorkspace();
  const contacts = await listContacts(workspace.id, status, search);
  return <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-5xl space-y-6 px-4 py-7 outline-none sm:px-6 sm:py-9 lg:px-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">Référentiel</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Contacts</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Votre carnet professionnel privé, organisé par contexte.</p></div><Link href="/contacts/new" className={cn(buttonVariants(), "w-full sm:w-auto")}><Plus aria-hidden="true" className="size-4" /> Nouveau contact</Link></div>
    <form role="search" className="flex flex-col gap-2 sm:flex-row"><label htmlFor="contact-search" className="sr-only">Rechercher un contact</label><div className="relative flex-1"><Search aria-hidden="true" className="absolute left-3 top-3 size-4 text-muted-foreground" /><input id="contact-search" name="q" type="search" defaultValue={search} placeholder="Nom ou adresse e-mail" className="h-10 w-full rounded-md border bg-card pl-9 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>{status === "archived" ? <input type="hidden" name="status" value="archived" /> : null}<button type="submit" className={buttonVariants({ variant: "outline" })}>Rechercher</button></form>
    <nav aria-label="Filtrer les contacts" className="flex gap-2"><Link href={search ? `/contacts?q=${encodeURIComponent(search)}` : "/contacts"} aria-current={status === "active" ? "page" : undefined} className={buttonVariants({ variant: status === "active" ? "default" : "outline", size: "sm" })}>Actifs</Link><Link href={`/contacts?status=archived${search ? `&q=${encodeURIComponent(search)}` : ""}`} aria-current={status === "archived" ? "page" : undefined} className={buttonVariants({ variant: status === "archived" ? "default" : "outline", size: "sm" })}>Archivés</Link></nav>
    <Card><CardContent><ContactList contacts={contacts} emptyAction={status === "active" && !search ? <Link href="/contacts/new" className={buttonVariants()}>Créer un contact</Link> : undefined} /></CardContent></Card>
  </main>;
}
