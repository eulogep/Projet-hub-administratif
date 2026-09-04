export type UploadOperation = { method: "GET" | "PUT" | "POST" | "DELETE"; uploadId?: string; partNumber?: number };
export interface DocumentStorageProvider {
  presignUploadOperation(input: { key: string; mime: string; operation: UploadOperation }): Promise<string>;
  headObject(key: string): Promise<{ size: number; etag: string | null }>;
  readSignature(key: string, bytes: number): Promise<Uint8Array>;
  streamObject(key: string): Promise<ReadableStream<Uint8Array>>;
  createDownloadUrl(key: string, filename: string): Promise<string>;
  abortMultipartUpload(key: string, uploadId: string): Promise<void>;
  deleteObject(key: string): Promise<void>;
}
