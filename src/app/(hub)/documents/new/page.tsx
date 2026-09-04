import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/auth/get-active-workspace";
import { DocumentUploadForm } from "@/modules/documents/components/document-upload-form";
import { getDocumentContexts } from "@/modules/documents/services/document-context.service";
import { getDocumentMaxFileSizeBytes } from "@/modules/documents/policy";
export default async function NewDocumentPage() { const workspace = await getActiveWorkspace(); const contexts = await getDocumentContexts(workspace.id); return <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7 outline-none sm:px-6 sm:py-9"><div><p className="text-sm font-medium text-primary">Documents</p><h1 className="mt-1 text-2xl font-semibold">Nouveau document</h1></div><Card><CardHeader><CardTitle>Métadonnées et fichier</CardTitle><CardDescription>Le fichier reste privé et ne devient disponible qu’après vérification serveur.</CardDescription></CardHeader><CardContent><DocumentUploadForm contexts={contexts} maxFileSize={getDocumentMaxFileSizeBytes()} /></CardContent></Card></main>; }
