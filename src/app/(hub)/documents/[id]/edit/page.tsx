import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { updateDocumentAction } from "@/modules/documents/actions/document.actions";
import { DocumentEditForm } from "@/modules/documents/components/document-edit-form";
import { getDocumentContexts } from "@/modules/documents/services/document-context.service";
import { getDocument } from "@/modules/documents/services/document.service";
import type { DocumentMetadata } from "@/modules/documents/schemas/document.schema";
export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const workspace = await getActiveWorkspace(); const [document, contexts] = await Promise.all([getDocument(workspace.id, id), getDocumentContexts(workspace.id)]); if (!document) notFound(); return <main id="main-content" className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7 sm:px-6 sm:py-9"><h1 className="text-2xl font-semibold">Modifier le document</h1><Card><CardHeader><CardTitle>Métadonnées</CardTitle></CardHeader><CardContent><DocumentEditForm id={id} contexts={contexts} document={document as DocumentMetadata} action={updateDocumentAction.bind(null, id)} /></CardContent></Card></main>; }
