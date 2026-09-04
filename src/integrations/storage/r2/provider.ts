import "server-only";
import { AbortMultipartUploadCommand, CompleteMultipartUploadCommand, CreateMultipartUploadCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListPartsCommand, PutObjectCommand, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { DocumentStorageProvider, UploadOperation } from "../document-storage-provider";
import { getR2Client } from "./client";
import { getR2Config } from "./config";

function disposition(filename: string) { const safe = filename.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180) || "document"; return `attachment; filename="${safe.replace(/["\\]/g, "_")}"`; }

export class R2DocumentStorageProvider implements DocumentStorageProvider {
  private command(key: string, mime: string, operation: UploadOperation) {
    const base = { Bucket: getR2Config().bucket, Key: key };
    if (operation.method === "PUT" && operation.uploadId && operation.partNumber) return new UploadPartCommand({ ...base, UploadId: operation.uploadId, PartNumber: operation.partNumber });
    if (operation.method === "PUT" && !operation.uploadId) return new PutObjectCommand({ ...base, ContentType: mime });
    if (operation.method === "POST" && operation.uploadId) return new CompleteMultipartUploadCommand({ ...base, UploadId: operation.uploadId });
    if (operation.method === "POST") return new CreateMultipartUploadCommand({ ...base, ContentType: mime });
    if (operation.method === "GET" && operation.uploadId) return new ListPartsCommand({ ...base, UploadId: operation.uploadId });
    if (operation.method === "DELETE" && operation.uploadId) return new AbortMultipartUploadCommand({ ...base, UploadId: operation.uploadId });
    if (operation.method === "DELETE") return new DeleteObjectCommand(base);
    throw new Error("Unsupported upload operation.");
  }
  async presignUploadOperation({ key, mime, operation }: { key: string; mime: string; operation: UploadOperation }) {
    const expiresIn = operation.method === "PUT" ? 900 : 60;
    return getSignedUrl(getR2Client(), this.command(key, mime, operation) as never, { expiresIn });
  }
  async headObject(key: string) { const output = await getR2Client().send(new HeadObjectCommand({ Bucket: getR2Config().bucket, Key: key })); return { size: output.ContentLength ?? 0, etag: output.ETag ?? null }; }
  async readSignature(key: string, bytes: number) { const output = await getR2Client().send(new GetObjectCommand({ Bucket: getR2Config().bucket, Key: key, Range: `bytes=0-${bytes - 1}` })); if (!output.Body) throw new Error("R2_OBJECT_BODY_MISSING"); return output.Body.transformToByteArray(); }
  async streamObject(key: string) { const output = await getR2Client().send(new GetObjectCommand({ Bucket: getR2Config().bucket, Key: key })); if (!output.Body) throw new Error("R2_OBJECT_BODY_MISSING"); return output.Body.transformToWebStream() as ReadableStream<Uint8Array>; }
  async createDownloadUrl(key: string, filename: string) { return getSignedUrl(getR2Client(), new GetObjectCommand({ Bucket: getR2Config().bucket, Key: key, ResponseContentDisposition: disposition(filename) }), { expiresIn: 60 }); }
  async abortMultipartUpload(key: string, uploadId: string) { await getR2Client().send(new AbortMultipartUploadCommand({ Bucket: getR2Config().bucket, Key: key, UploadId: uploadId })); }
  async deleteObject(key: string) { await getR2Client().send(new DeleteObjectCommand({ Bucket: getR2Config().bucket, Key: key })); }
}
