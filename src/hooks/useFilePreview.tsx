import Modal from "@/components/modal";
import Image from "next/image";
import React, { useCallback, useMemo, useState } from "react";

interface UseFilePreviewOptions {
  onError?: (error: any, fallbackMessage?: string) => void;
}

export function useFilePreview(options: UseFilePreviewOptions = {}) {
  const { onError } = options;
  const [previewingFilePath, setPreviewingFilePath] = useState<string | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>("");
  const [previewType, setPreviewType] = useState<"image" | "pdf" | "office" | "unsupported">("office");

  const closePreview = useCallback(() => {
    setPreviewFileUrl(null);
    setPreviewFileName("");
    setPreviewType("office");
  }, []);

  const getFileExtension = useCallback((filePath: string) => {
    const fileName = String(filePath || "").split("?")[0].split("#")[0];
    const ext = fileName.split(".").pop();
    return ext ? ext.toLowerCase() : "";
  }, []);

  const resolvePreviewType = useCallback((filePath: string) => {
    const ext = getFileExtension(filePath);

    const imageExts = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"]);
    const officeExts = new Set(["xls", "xlsx", "csv", "doc", "docx", "ppt", "pptx"]);

    if (imageExts.has(ext)) return "image" as const;
    if (ext === "pdf") return "pdf" as const;
    if (officeExts.has(ext)) return "office" as const;
    return "unsupported" as const;
  }, [getFileExtension]);

  const getSignedFileUrl = useCallback(async (filePath: string) => {
    const key = String(filePath || "").trim().replace(/^\/+/, "");
    if (!key) throw new Error("File path is required");

    const params = new URLSearchParams({ key });
    const response = await fetch(`/api/upload/file-url?${params.toString()}`);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error || "Failed to fetch file URL");
    }

    const payload = (await response.json()) as { url: string };
    return payload.url;
  }, []);

  const openFilePreview = useCallback(
    async (filePath: string) => {
      if (!filePath) {
        onError?.({ message: "No file available for preview." });
        return;
      }

      setPreviewingFilePath(filePath);
      try {
        const signedUrl = await getSignedFileUrl(filePath);
        const type = resolvePreviewType(filePath);
        const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(signedUrl)}`;
        const fileName = String(filePath).split("/").pop() || "File";

        setPreviewFileName(fileName);
        setPreviewType(type);
        setPreviewFileUrl(type === "office" ? officeViewerUrl : signedUrl);
      } catch (error: any) {
        onError?.(error, "Failed to preview file");
      } finally {
        setPreviewingFilePath(null);
      }
    },
    [getSignedFileUrl, onError, resolvePreviewType]
  );

  const previewModal = useMemo(
    () => (
      <Modal
        isOpen={Boolean(previewFileUrl)}
        onClose={closePreview}
        title={previewFileName ? `Preview - ${previewFileName}` : "File Preview"}
        className="!w-[95vw] !max-w-6xl"
      >
        <div className="h-[75vh] w-full">
          {previewFileUrl && previewType === "image" ? (
            <div className="h-full w-full flex items-center justify-center bg-[#F7F8FA] rounded-md border border-[#C4C4C452]">
              <Image
                src={previewFileUrl}
                alt={previewFileName || "File preview"}
                width={1200}
                height={800}
                unoptimized
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : null}

          {previewFileUrl && (previewType === "pdf" || previewType === "office") ? (
            <iframe
              src={previewFileUrl}
              className="h-full w-full rounded-md border border-[#C4C4C452]"
              title="File preview"
            />
          ) : null}

          {previewFileUrl && previewType === "unsupported" ? (
            <div className="h-full w-full flex flex-col items-center justify-center rounded-md border border-[#C4C4C452] bg-[#F7F8FA] px-6 text-center">
              <p className="text-sm font-semibold text-[#090727] mb-2">Preview not supported for this file type.</p>
              <a
                href={previewFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#005BB0] underline"
              >
                Open file in new tab
              </a>
            </div>
          ) : null}
        </div>
      </Modal>
    ),
    [previewFileUrl, previewFileName, previewType, closePreview]
  );

  return {
    previewingFilePath,
    openFilePreview,
    closePreview,
    previewModal,
  };
}

export default useFilePreview;
