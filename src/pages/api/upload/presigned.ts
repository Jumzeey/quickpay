/**
 * GET /api/upload/presigned
 * Query: key (required), contentType (required)
 * Returns a pre-signed PUT URL for direct client-to-S3 upload.
 */
import { getPresignedUploadUrl } from "@/lib/s3";
import type { NextApiRequest, NextApiResponse } from "next";

type Success = { url: string; key: string };
type Error = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Success | Error>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = req.query.key as string | undefined;
  const contentType = req.query.contentType as string | undefined;

  if (!key?.trim()) {
    return res.status(400).json({ error: "Query parameter 'key' is required" });
  }
  if (!contentType?.trim()) {
    return res
      .status(400)
      .json({ error: "Query parameter 'contentType' is required" });
  }

  const normalizedKey = key.trim().replace(/^\/+/, "");

  try {
    const { url, key: resolvedKey } = await getPresignedUploadUrl({
      key: normalizedKey,
      contentType: contentType.trim(),
      expiresIn: 3600,
    });
    return res.status(200).json({ url, key: resolvedKey });
  } catch (err) {
    console.error("Presigned URL error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to generate upload URL",
    });
  }
}
