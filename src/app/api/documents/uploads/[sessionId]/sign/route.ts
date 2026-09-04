import { NextResponse } from "next/server";
import { signUploadOperation } from "@/modules/documents/services/upload-signing.service";

export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try { const { sessionId } = await params; const url = await signUploadOperation(sessionId, await request.json()); return NextResponse.json({ url }); }
  catch { return NextResponse.json({ error: "UPLOAD_OPERATION_DENIED" }, { status: 403 }); }
}
