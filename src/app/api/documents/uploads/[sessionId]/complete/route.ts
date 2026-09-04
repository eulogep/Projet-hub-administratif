import { NextResponse } from "next/server";
import { DocumentFinalizationService } from "@/modules/documents/services/document-finalization.service";

export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try { const { sessionId } = await params; const result = await new DocumentFinalizationService().finalize(sessionId); return NextResponse.json(result); }
  catch { return NextResponse.json({ error: "DOCUMENT_FINALIZATION_FAILED" }, { status: 422 }); }
}
