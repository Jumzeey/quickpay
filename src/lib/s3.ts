/**
 * S3 client and presigner — server only.
 * Do not import this file from client components (it uses env vars and Node-only SDK).
 */
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION ?? "us-east-1";
const bucket = process.env.AWS_BUCKET_NAME;

if (!bucket) {
  console.warn("AWS_BUCKET_NAME is not set; S3 operations will fail.");
}

const s3Client = new S3Client({
  region,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export { s3Client };

export interface PresignedUploadOptions {
  /** S3 object key (path + filename), e.g. "uploads/abc-123/image.png" */
  key: string;
  /** MIME type, e.g. "image/png". Required for correct browser handling. */
  contentType: string;
  /** URL validity in seconds. Default 3600 (1 hour). */
  expiresIn?: number;
}

/**
 * Returns a pre-signed PUT URL so the client can upload directly to S3.
 * Use this from an API route; do not call from the client.
 */
export async function getPresignedUploadUrl(
  options: PresignedUploadOptions
): Promise<{ url: string; key: string }> {
  if (!bucket) {
    throw new Error("AWS_BUCKET_NAME is not set");
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: options.key,
    ContentType: options.contentType,
  });

  const expiresIn = options.expiresIn ?? 3600;
  const url = await getSignedUrl(s3Client, command, { expiresIn });

  return { url, key: options.key };
}
