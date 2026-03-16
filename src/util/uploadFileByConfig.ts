import { uploadConfig } from "@/config/upload";
import { uploadToS3 } from "@/lib/uploadToS3";
import { uploadFile } from "@/services/kyc";

/**
 * Upload a file using the app's uploadConfig:
 * - When S3 is enabled, uploads directly to S3 and returns the public URL.
 * - Otherwise, uploads via the legacy utility API and returns the stored file URL/path.
 */
export async function uploadFileByConfig(file: File, folder?: string): Promise<string> {
  if (uploadConfig.useS3) {
    const keyPrefix = (folder || "uploads").replace(/^\/+|\/+$/g, "");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${keyPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 11)}-${safeName}`;
    const result = await uploadToS3({ file, key });
    return result.url;
  }

  const formData = new FormData();
  formData.append("file", file);
  if (folder) formData.append("folder", folder);
  const response = await uploadFile(formData);
  return response.data.file;
}

