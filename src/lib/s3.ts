/**
 * S3 client and presigner — server only.
 * Do not import this file from client components (it uses env vars and Node-only SDK).
 */
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.BUCKET_REGION ?? "us-east-1";
const bucket = process.env.BUCKET_NAME;

if (!bucket) {
  console.warn("BUCKET_NAME is not set; S3 operations will fail.");
}

const s3Client = new S3Client({
  region,
  credentials:
    process.env.BUCKET_ACCESS_KEY_ID && process.env.BUCKET_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.BUCKET_ACCESS_KEY_ID,
          secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export { s3Client };

export interface PresignedUploadOptions {
  key: string;
  contentType: string;
  expiresIn?: number;
}

/**
 * Returns a pre-signed PUT URL so the client can upload directly to S3.
 * Use this from an API route; do not call from the client.
 */
export async function getPresignedUploadUrl(
  options: PresignedUploadOptions,
): Promise<{ url: string; key: string }> {
  if (!bucket) {
    throw new Error("BUCKET_NAME is not set");
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: options.key,
    ContentType: options.contentType,
  });

  // Shorter expiry = less time the URL (and credential in it) is valid if leaked
  const expiresIn = options.expiresIn ?? 900; // 15 minutes (was 3600)
  const url = await getSignedUrl(s3Client, command, { expiresIn });

  return { url, key: options.key };
}
