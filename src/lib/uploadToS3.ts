/**
 * Client-safe helper: get a presigned URL from our API and upload a file directly to S3.
 * No AWS keys are used on the client.
 */

export interface UploadToS3Result {
  key: string;
  url: string;
}

export interface UploadToS3Options {
  /** The file to upload. */
  file: File;
  /**
   * S3 object key (path + filename).
   * If not provided, a key is generated as: uploads/{timestamp}-{randomId}/{filename}
   */
  key?: string;
}

/**
 * 1. Requests a presigned PUT URL from our API.
 * 2. Uploads the file directly to S3 with that URL.
 * Returns the S3 key and the public URL (if your bucket is configured for public read).
 * @throws On API or upload failure.
 */
export async function uploadToS3(
  options: UploadToS3Options
): Promise<UploadToS3Result> {
  const { file, key: customKey } = options;

  const key =
    customKey ??
    `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 11)}/${file.name}`;

  const params = new URLSearchParams({
    key,
    contentType: file.type || "application/octet-stream",
  });

  const apiUrl = `/api/upload/presigned?${params.toString()}`;
  const res = await fetch(apiUrl);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      data?.error || `Failed to get upload URL: ${res.status} ${res.statusText}`
    );
  }

  const { url } = (await res.json()) as { url: string; key: string };

  const putRes = await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });

  if (!putRes.ok) {
    throw new Error(
      `Upload failed: ${putRes.status} ${putRes.statusText}`
    );
  }

  const baseUrl = (process.env.NEXT_PUBLIC_IMAGE_URL ?? "").replace(/\/$/, "");
  const objectUrl = baseUrl ? `${baseUrl}/${key}` : key;

  return { key, url: objectUrl };
}
