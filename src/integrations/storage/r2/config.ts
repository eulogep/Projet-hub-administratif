import "server-only";
import { z } from "zod";

const schema = z.object({
  R2_ACCOUNT_ID: z.string().min(1), R2_ACCESS_KEY_ID: z.string().min(1), R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1), R2_ENDPOINT: z.url().refine((url) => url.startsWith("https://"), "HTTPS is required"),
});

export function getR2Config() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) throw new Error("R2_DOCUMENT_STORAGE_NOT_CONFIGURED");
  const endpoint = new URL(parsed.data.R2_ENDPOINT);
  const expectedHost = `${parsed.data.R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`.toLowerCase();
  if (endpoint.hostname.toLowerCase() !== expectedHost) throw new Error("R2_EU_ENDPOINT_REQUIRED");
  return { accountId: parsed.data.R2_ACCOUNT_ID, accessKeyId: parsed.data.R2_ACCESS_KEY_ID, secretAccessKey: parsed.data.R2_SECRET_ACCESS_KEY, bucket: parsed.data.R2_BUCKET_NAME, endpoint: endpoint.toString().replace(/\/$/, "") };
}
