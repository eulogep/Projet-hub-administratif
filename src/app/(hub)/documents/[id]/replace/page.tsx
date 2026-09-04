import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { getDocumentMaxFileSizeBytes } from "@/modules/documents/policy";
import { DocumentUploadForm } from "@/modules/documents/components/document-upload-form";
import { getDocumentContexts } from "@/modules/documents/services/document-context.service";
import { getDocument } from "@/modules/documents/services/document.service";
import type { DocumentMetadata } from "@/modules/documents/schemas/document.schema";
export default async function ReplaceDocumentPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const workspace = await getActiveWorkspace(); const [document, contexts] = await Promise.all([getDocument(workspace.id, id), getDocumentContexts(workspace.id)]); if (!document || document.archived_at) notFound(); return <main id="main-content" className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7 sm:px-6 sm:py-9"><h1 className="text-2xl font-semibold">Nouvelle version</h1><Card><CardHeader><CardTitle>{document.name}</CardTitle><CardDescription>La version actuelle restera disponible dans l’historique.</CardDescription></CardHeader><CardContent><DocumentUploadForm contexts={contexts} maxFileSize={getDocumentMaxFileSizeBytes()} documentId={id} document={document as DocumentMetadata} /></CardContent></Card></main>; }
