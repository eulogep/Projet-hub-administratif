import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createUploadSession } from "@/modules/documents/services/upload-session.service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try { const session = await createUploadSession(await request.json()); return NextResponse.json({ sessionId: session.id, documentId: session.document_id, key: session.storage_key }); }
  catch (error) { const message = error instanceof ZodError ? "INVALID_UPLOAD_REQUEST" : error instanceof Error ? error.message : "UPLOAD_SESSION_CREATE_FAILED"; return NextResponse.json({ error: message }, { status: message === "R2_DOCUMENT_STORAGE_NOT_CONFIGURED" ? 503 : 400 }); }
}
