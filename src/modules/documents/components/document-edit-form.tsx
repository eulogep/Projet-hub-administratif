"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DocumentActionState } from "../actions/document.actions";
import type { DocumentMetadata } from "../schemas/document.schema";
import { DocumentFields, type DocumentContextOptions } from "./document-fields";
export function DocumentEditForm({ action, document, contexts, id }: { action: (state: DocumentActionState, formData: FormData) => Promise<DocumentActionState>; document: DocumentMetadata; contexts: DocumentContextOptions; id: string }) { const [state, formAction, pending] = useActionState(action, {}); return <form action={formAction} className="space-y-6" noValidate><DocumentFields contexts={contexts} document={document} errors={state.fieldErrors} />{state.message ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href={`/documents/${id}`} className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>Annuler</Link><Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button></div></form>; }
