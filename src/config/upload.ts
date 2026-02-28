/**
 * File upload configuration.
 * When true, features that support S3 (e.g. bulk payout) will upload via S3 and send the file URL.
 * When false, the file is sent directly in the request (regular multipart upload).
 *
 * Set NEXT_PUBLIC_USE_S3_FILE_UPLOAD=true in env to enable S3 (default: false).
 * Note: Next.js inlines NEXT_PUBLIC_* at build/compile time — restart the dev server after changing this.
 */
const useS3FileUpload =
  process.env.NEXT_PUBLIC_USE_S3_FILE_UPLOAD === "true" ||
  process.env.NEXT_PUBLIC_USE_S3_FILE_UPLOAD === "1";

export const uploadConfig = {
  /** If true, use S3 for file uploads where configured (e.g. bulk payout). If false, use regular multipart upload. */
  useS3: useS3FileUpload,
} as const;

export default uploadConfig;
