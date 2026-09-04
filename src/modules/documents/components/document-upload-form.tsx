"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import AwsS3 from "@uppy/aws-s3";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DOCUMENT_ALLOWED_MIME_TYPES, DOCUMENT_MULTIPART_THRESHOLD_BYTES, DOCUMENT_PART_SIZE_BYTES, DOCUMENT_RETRY_DELAYS } from "../policy";
import { DocumentFields, type DocumentContextOptions } from "./document-fields";
import type { DocumentMetadata } from "../schemas/document.schema";

type Session = { id: string; key: string; documentId: string };
export function DocumentUploadForm({ contexts, maxFileSize, documentId, document }: { contexts: DocumentContextOptions; maxFileSize: number; documentId?: string; document?: Partial<DocumentMetadata> }) {
  const router = useRouter();
  const dashboard = useRef<HTMLDivElement>(null); const session = useRef<Session | null>(null); const uppyRef = useRef<Uppy | null>(null); const retryCount = useRef(0);
  const [status, setStatus] = useState("Sélectionnez un fichier PDF, PNG ou JPEG."); const [busy, setBusy] = useState(false); const [error, setError] = useState<string>();
  useEffect(() => {
    if (!dashboard.current) return;
    const uppy = new Uppy({ restrictions: { maxNumberOfFiles: 1, minFileSize: 1, maxFileSize, allowedFileTypes: [...DOCUMENT_ALLOWED_MIME_TYPES] }, autoProceed: false });
    uppy.use(Dashboard, { inline: true, target: dashboard.current, hideUploadButton: true, proudlyDisplayPoweredByUppy: false, note: `PDF, PNG ou JPEG — maximum ${Math.floor(maxFileSize / 1024 / 1024)} MiB` });
    uppy.use(AwsS3, { shouldUseMultipart: (file) => (file.size ?? 0) > DOCUMENT_MULTIPART_THRESHOLD_BYTES, getChunkSize: () => DOCUMENT_PART_SIZE_BYTES, generateObjectKey: () => { if (!session.current) throw new Error("Upload session missing"); return session.current.key; }, signRequest: async (request) => { if (!session.current) throw new Error("Upload session missing"); const response = await fetch(`/api/documents/uploads/${session.current.id}/sign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) }); if (!response.ok) throw new Error("Signature refusée"); return response.json(); } });
    uppy.on("upload-progress", (_file, progress) => { const percent = progress.bytesTotal ? Math.round(progress.bytesUploaded / progress.bytesTotal * 100) : 0; setStatus(`Téléversement : ${percent} %`); });
    uppy.on("upload-error", () => { const delay = DOCUMENT_RETRY_DELAYS[retryCount.current++]; if (delay !== undefined) { setStatus(`Nouvelle tentative ${retryCount.current}/${DOCUMENT_RETRY_DELAYS.length}…`); window.setTimeout(() => void uppy.retryAll(), delay); } else { setBusy(false); setError("Le téléversement a échoué. Utilisez Réessayer ou annulez."); setStatus("Téléversement interrompu."); } });
    uppyRef.current = uppy; return () => { uppy.destroy(); uppyRef.current = null; };
  }, [maxFileSize]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(undefined); const uppy = uppyRef.current; const file = uppy?.getFiles()[0]; if (!uppy || !file || !file.size || !file.type) { setError("Sélectionnez un fichier autorisé."); return; }
    setBusy(true); retryCount.current = 0; setStatus("Création de la session sécurisée…");
    const form = new FormData(event.currentTarget); const payload = Object.fromEntries(form.entries());
    try { const response = await fetch("/api/documents/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, document_id: documentId, original_file_name: file.name, expected_size: file.size, expected_mime: file.type }) }); const created = await response.json(); if (!response.ok) throw new Error(created.error); session.current = { id: created.sessionId, key: created.key, documentId: created.documentId }; const result = await uppy.upload(); if (!result || result.failed?.length) throw new Error("UPLOAD_FAILED"); setStatus("Vérification de l’intégrité…"); const completed = await fetch(`/api/documents/uploads/${created.sessionId}/complete`, { method: "POST" }); if (!completed.ok) throw new Error("FINALIZATION_FAILED"); router.push(`/documents/${created.documentId}`); router.refresh(); }
    catch { setBusy(false); setError("Le document n’a pas pu être finalisé. Aucun fichier non vérifié n’est publié."); setStatus("Échec — une nouvelle tentative est possible."); }
  }
  async function cancel() { uppyRef.current?.cancelAll(); if (session.current) await fetch(`/api/documents/uploads/${session.current.id}/abort`, { method: "POST" }); setBusy(false); setStatus("Téléversement annulé."); }
  return <form onSubmit={submit} className="min-w-0 space-y-6"><DocumentFields contexts={contexts} document={document} /><fieldset disabled={busy} className="min-w-0 space-y-3"><legend className="text-sm font-medium">{documentId ? "Nouveau fichier" : "Fichier"}</legend><div ref={dashboard} className="min-w-0 max-w-full" /></fieldset><p role="status" aria-live="polite" className="text-sm text-muted-foreground">{status}</p>{error ? <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href={documentId ? `/documents/${documentId}` : "/documents"} className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>Retour</Link>{busy ? <Button type="button" variant="destructive" onClick={cancel}>Annuler le téléversement</Button> : null}<Button type="submit" disabled={busy}>{busy ? "Téléversement…" : documentId ? "Ajouter la version" : "Créer le document"}</Button>{error && !busy ? <Button type="button" variant="outline" onClick={() => { setError(undefined); void uppyRef.current?.retryAll(); }}>Réessayer</Button> : null}</div></form>;
}
