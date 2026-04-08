/**
 * GET /api/upload/file-url
 * Query: key (required)
 * Returns a pre-signed GET URL for preview/download from S3.
 */
import { getPresignedDownloadUrl } from "@/lib/s3";
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
  if (!key?.trim()) {
    return res.status(400).json({ error: "Query parameter 'key' is required" });
  }

  const normalizedKey = key.trim().replace(/^\/+/, "");

  try {
    const { url, key: resolvedKey } = await getPresignedDownloadUrl({
      key: normalizedKey,
      expiresIn: 900,
    });
    return res.status(200).json({ url, key: resolvedKey });
  } catch (err) {
    console.error("File URL generation error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to generate file URL",
    });
  }
}
