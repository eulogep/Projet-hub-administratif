import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
import { getR2Config } from "./config";

let cached: S3Client | undefined;
export function getR2Client() {
  if (!cached) { const config = getR2Config(); cached = new S3Client({ region: "auto", endpoint: config.endpoint, credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } }); }
  return cached;
}
