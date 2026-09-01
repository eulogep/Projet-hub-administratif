import Link from "next/link";
import { ArrowRight, ContactRound } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { ContactSummary } from "../services/contact.service";

export function ContactList({ contacts, emptyAction }: { contacts: ContactSummary[]; emptyAction?: React.ReactNode }) {
  if (!contacts.length) return <EmptyState icon={ContactRound} title="Aucun contact" description="Aucun contact ne correspond à ce filtre." action={emptyAction} />;
  return <ul className="grid gap-3" aria-label="Contacts">{contacts.map((contact) => <li key={contact.id}><Link href={`/contacts/${contact.id}`} className="group flex min-h-20 items-center justify-between gap-4 rounded-xl border bg-card px-4 py-3 outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><span className="min-w-0"><span className="block truncate font-medium">{contact.display_name}</span><span className="mt-1 block truncate text-sm text-muted-foreground">{contact.primary_email ?? contact.primary_phone ?? "Aucune coordonnée"}</span><span className="mt-1 block text-xs text-muted-foreground">{contact.contact_organizations.map((link) => link.organization?.name).filter(Boolean).join(" · ") || "Sans organisation"}</span></span><ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></Link></li>)}</ul>;
}
