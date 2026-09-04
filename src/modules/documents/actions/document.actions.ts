"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { createClient } from "@/lib/supabase/server";
import { documentMetadataSchema } from "../schemas/document.schema";

export type DocumentActionState = { message?: string; fieldErrors?: Record<string, string[] | undefined> };
function values(formData: FormData) { return { name: formData.get("name"), category: formData.get("category"), status: formData.get("status"), organization_id: formData.get("organization_id"), project_id: formData.get("project_id"), mission_id: formData.get("mission_id"), issued_on: formData.get("issued_on"), expires_on: formData.get("expires_on"), notes: formData.get("notes") }; }
export async function updateDocumentAction(documentId: string, _state: DocumentActionState, formData: FormData): Promise<DocumentActionState> {
  const id = z.uuid().safeParse(documentId); const parsed = documentMetadataSchema.safeParse(values(formData)); if (!id.success || !parsed.success) return { message: "Corrigez les champs indiqués.", fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors };
  const workspace = await getActiveWorkspace(); const supabase = await createClient(); const result = await supabase.from("documents").update(parsed.data).eq("workspace_id", workspace.id).eq("id", id.data).select("id").maybeSingle(); if (result.error || !result.data) return { message: "Le document n’a pas pu être modifié." }; revalidatePath("/documents"); revalidatePath(`/documents/${id.data}`); redirect(`/documents/${id.data}`);
}
export async function archiveDocumentAction(documentId: string) { const id = z.uuid().parse(documentId); const workspace = await getActiveWorkspace(); const supabase = await createClient(); const result = await supabase.from("documents").update({ archived_at: new Date().toISOString(), status: "archived" }).eq("workspace_id", workspace.id).eq("id", id).is("archived_at", null).select("id").maybeSingle(); if (result.error || !result.data) throw new Error("Unable to archive document."); revalidatePath("/documents"); redirect("/documents?archive=archived"); }
