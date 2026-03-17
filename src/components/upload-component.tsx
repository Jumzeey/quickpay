// import Icon from "@/components/icon";
// import { uploadFile } from "@/services/kyc";
// import { notifyError } from "@/util/utils";
// import Image from "next/image";
// import React, { ChangeEvent, useRef, useState } from "react";
// import { Spinner } from "./Spinner";

// interface UploadComponentProps {
//   onFileUpload?: (file: string, name: string) => void;
//   buttonText?: string;
//   name: string;
//   text: string;
//   folderName?: string;
//   setMandateFile?: (value: File) => void;
//   className?: string;
// }

// const UploadComponent: React.FC<UploadComponentProps> = ({
//   onFileUpload,
//   buttonText = "Browse",
//   name,
//   text,
//   folderName,
//   setMandateFile,
//   className = "",
// }) => {
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
//   const [uploadedFile, setUploadedFile] = useState<File | null>(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

//   const handleButtonClick = () => {
//     fileInputRef.current?.click();
//   };

//   const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files && event.target.files[0];
//     if (file) {
//       const validFormats = [
//         "image/jpeg",
//         "image/jpg",
//         "image/png",
//         "application/pdf",
//       ];
//       const maxSize = 3 * 1024 * 1024;

//       if (!validFormats.includes(file.type)) {
//         notifyError(
//           "Unsupported file format. Please upload a JPG, PNG, or PDF file."
//         );
//         return;
//       }

//       if (file.size > maxSize) {
//         notifyError("File size exceeds 3MB. Please upload a smaller file.");
//         return;
//       }

//       const formData = new FormData();
//       formData.append("file", file);
//       folderName && formData.append("folder", folderName);
//       const fileUrl = URL.createObjectURL(file);
//       setPreviewUrl(fileUrl);
//       setUploadedFile(file);

//       if (folderName) {
//         try {
//           setIsUploading(true);
//           const response = await uploadFile(formData);
//           onFileUpload && onFileUpload(response.data.file, name);
//         } catch (error: any) {
//           notifyError(error.message);
//           URL.revokeObjectURL(fileUrl);
//           setPreviewUrl(null);
//           setUploadedFile(null);
//         } finally {
//           setIsUploading(false);
//         }
//       }
//       setUploadedFileName(file.name);
//       setMandateFile && setMandateFile(file);
//     }
//   };

//   const handleDelete = () => {
//     if (previewUrl) {
//       URL.revokeObjectURL(previewUrl);
//     }
//     setPreviewUrl(null);
//     setUploadedFile(null);
//     setUploadedFileName(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   return (
//     <div className={className}>
//       <p className="text-black text-sm font-semibold mb-0.5">{text}</p>

//       <div className="rounded border border-[#C4C4C43D] bg-[#D9D9D90D] p-4 h-[90%] flex flex-col items-center justify-center">
//         <div className="w-full flex flex-col items-center justify-center text-center">
//           <div className="size-10 rounded bg-[#FDFDFD] flex items-center justify-center border border-[#C4C4C41A]">
//             <Icon
//               name="upload"
//               className="text-[#121212]"
//             />
//           </div>
//           <p className="text-sm font-medium text-[#7F7F7F] mt-3">
//             <button
//               onClick={handleButtonClick}
//               className="text-primary mr-1 cursor-pointer"
//               type="button"
//             >
//               Click to upload
//             </button>
//             JPG, PNG or PDF file (max. 3MB)
//           </p>
//           <input
//             type="file"
//             ref={fileInputRef}
//             name={name}
//             onChange={handleFileChange}
//             accept=".jpeg, .jpg, .png, .pdf"
//             className="hidden"
//           />
//         </div>
//         {isUploading && (
//           <div className="mt-4 text-center text-blue-500">
//             <Spinner />
//           </div>
//         )}
//         {uploadedFileName && (
//           <p className="mt-4 text-xs text-center sarepayPrimary font-semibold">
//             Uploaded file: {uploadedFileName}
//           </p>
//         )}
//         {previewUrl && (
//           <div className="mt-4 relative border border-danger">
//             <Image src={previewUrl} alt={"Preview"} width={100} height={100} />
//             <button
//               onClick={handleDelete}
//               className="absolute top-0 right-0 bg-red-500 rounded-full p-1 cursor-pointer"
//             >
//               <Image
//                 src="/images/dashboard/collections/delete.svg"
//                 alt="Delete"
//                 width={10}
//                 height={10}
//               />
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default UploadComponent;

import Icon from "@/components/icon";
import { uploadConfig } from "@/config/upload";
import { uploadToS3 } from "@/lib/uploadToS3";
import { uploadFile } from "@/services/kyc";
import { notifyError } from "@/util/utils";
import Image from "next/image";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import Modal from "./modal";
import { Spinner } from "./Spinner";

interface DocumentWithType {
  id: string;
  file: File;
  title: string;
  documentType?: string;
  uploadedUrl?: string;
}

interface UploadComponentProps {
  onFileUpload?: (file: string, name: string) => void;
  buttonText?: string;
  name: string;
  text: string;
  folderName?: string;
  setMandateFile?: (value: File) => void;
  className?: string;
  showPreview?: boolean;
  value?: string; // Server URL for existing uploaded file
  error?: string;
  touched?: boolean;

  // New props for multiple file handling
  multiple?: boolean;
  documents?: DocumentWithType[];
  setDocuments?: React.Dispatch<React.SetStateAction<DocumentWithType[]>>;
  maxFiles?: number;
  /** When true (default), use S3 when uploadConfig.useS3 is enabled. When false, always use utility API. Set true for upgrade-account so it uses S3 config. */
  useS3WhenEnabled?: boolean;
  /** Disable selecting/uploading files (e.g. require prerequisite selection). */
  disabled?: boolean;
  /** Optional helper text shown when disabled. */
  disabledHint?: string;
}

const UploadComponent: React.FC<UploadComponentProps> = ({
  onFileUpload,
  buttonText = "Browse",
  name,
  showPreview = false,
  text,
  folderName,
  setMandateFile,
  className = "",
  multiple = false,
  documents = [],
  setDocuments,
  maxFiles = 10,
  useS3WhenEnabled = true,
  disabled = false,
  disabledHint,
  value, // Server URL for existing uploaded file
  error,
  touched,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputId = `upload-${name}-${multiple ? "multi" : "single"}`;

  // Legacy single file state (for backward compatibility)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedServerUrl, setUploadedServerUrl] = useState<string | null>(value || null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewModalType, setPreviewModalType] = useState<"image" | "pdf" | "office" | "unsupported">("unsupported");
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const hasError = Boolean(touched && error);

  // Update uploadedServerUrl when value prop changes
  useEffect(() => {
    if (value) {
      setUploadedServerUrl(value);
      // Extract filename from URL if possible
      try {
        const urlParts = value.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName && fileName.includes('.')) {
          setUploadedFileName(decodeURIComponent(fileName));
        }
      } catch (e) {
        // Ignore errors in filename extraction
      }
    } else if (!previewUrl) {
      // Clear server URL if value is cleared and no preview URL
      setUploadedServerUrl(null);
      setUploadedFileName(null);
    }
  }, [value, previewUrl]);

  const handleButtonClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const getFileExtension = (filePath: string) => {
    const fileName = String(filePath || "").split("?")[0].split("#")[0];
    const ext = fileName.split(".").pop();
    return ext ? ext.toLowerCase() : "";
  };

  const resolvePreviewType = (filePath: string) => {
    const ext = getFileExtension(filePath);
    const imageExts = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"]);
    const officeExts = new Set(["xls", "xlsx", "csv", "doc", "docx", "ppt", "pptx"]);

    if (imageExts.has(ext)) return "image";
    if (ext === "pdf") return "pdf";
    if (officeExts.has(ext)) return "office";
    return "unsupported";
  };

  const getSignedFileUrl = async (filePath: string) => {
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
  };

  const handlePreviewFile = async () => {
    const rawSource = uploadedServerUrl || previewUrl;
    if (!rawSource) {
      notifyError("No file available for preview");
      return;
    }

    setIsPreparingPreview(true);
    try {
      const isExternalOrBlob = /^https?:\/\//i.test(rawSource) || rawSource.startsWith("blob:");
      const signedUrl = isExternalOrBlob ? rawSource : await getSignedFileUrl(rawSource);
      const previewType = resolvePreviewType(uploadedFileName || rawSource);
      const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(signedUrl)}`;

      setPreviewModalType(previewType);
      setPreviewModalUrl(previewType === "office" ? officeViewerUrl : signedUrl);
      setPreviewModalOpen(true);
    } catch (error: any) {
      notifyError(error?.message || "Failed to preview file");
    } finally {
      setIsPreparingPreview(false);
    }
  };

  const uploadFileByConfig = async (file: File, folder?: string): Promise<string> => {
    if (uploadConfig.useS3 && useS3WhenEnabled) {
      const keyPrefix = (folder || "uploads").replace(/^\/+|\/+$/g, "");
      const key = `${keyPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 11)}-${file.name}`;
      const result = await uploadToS3({ file, key });
      return result.url;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (folder) {
      formData.append("folder", folder);
    }
    const response = await uploadFile(formData);
    return response.data.file;
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      // Reset file input so selecting the same file later still triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    // Validate files
    const validFiles: File[] = [];
    const validFormats = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of fileArray) {
      if (!validFormats.includes(file.type)) {
        notifyError(
          `${file.name}: Unsupported file format. Please upload JPG, PNG, PDF, or DOC files.`
        );
        continue;
      }

      if (file.size > maxSize) {
        notifyError(`${file.name}: File size exceeds 10MB. Please upload a smaller file.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Check max files limit for multiple uploads
    if (multiple && setDocuments && documents.length + validFiles.length > maxFiles) {
      notifyError(`Cannot upload more than ${maxFiles} files total.`);
      return;
    }

    if (multiple && setDocuments) {
      // Handle multiple file uploads
      setIsUploading(true);

      try {
        const newDocuments: DocumentWithType[] = [];

        for (const file of validFiles) {
          let uploadedUrl = '';

          if (folderName) {
            try {
              uploadedUrl = await uploadFileByConfig(file, folderName);
              onFileUpload && onFileUpload(uploadedUrl, name);
            } catch (error: any) {
              notifyError(`Failed to upload ${file.name}: ${error.message}`);
              continue;
            }
          }

          newDocuments.push({
            id: Math.random().toString(36).substr(2, 9),
            file,
            title: file.name.split('.')[0],
            documentType: '',
            uploadedUrl
          });
        }

        setDocuments(prev => [...prev, ...newDocuments]);
      } catch (error: any) {
        notifyError("Failed to upload files");
      } finally {
        setIsUploading(false);
      }
    } else {
      // Handle single file upload (legacy mode)
      const file = validFiles[0];
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
      setUploadedFile(file);
      setUploadedFileName(file.name);

      if (folderName) {
        try {
          setIsUploading(true);
          const serverUrl = await uploadFileByConfig(file, folderName);
          // Store server URL for preview
          setUploadedServerUrl(serverUrl);
          // Revoke blob URL since we now have server URL
          URL.revokeObjectURL(fileUrl);
          setPreviewUrl(null);
          onFileUpload && onFileUpload(serverUrl, name);
        } catch (error: any) {
          notifyError(error.message);
          URL.revokeObjectURL(fileUrl);
          setPreviewUrl(null);
          setUploadedFile(null);
          setUploadedFileName(null);
          setUploadedServerUrl(null);
        } finally {
          setIsUploading(false);
        }
      }

      setMandateFile && setMandateFile(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadedFile(null);
    setUploadedFileName(null);
    setUploadedServerUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Clear the form value
    onFileUpload && onFileUpload("", name);
  };

  const handleRemoveDocument = (documentId: string) => {
    if (!setDocuments) return;

    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'file-pdf';
      case 'doc':
      case 'docx':
        return 'file-text';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'file-image';
      default:
        return 'file';
    }
  };

  return (
    <div className={className}>
      <p className="text-black text-sm font-semibold mb-0.5">{text}</p>

      <div
        className={`rounded border p-4 h-auto min-h-[200px] flex flex-col items-center justify-center ${
          hasError ? "border-[#FD2727] bg-[#FFF5F5]" : "border-[#C4C4C43D] bg-[#D9D9D90D]"
        }`}
      >
        <div className="w-full flex flex-col items-center justify-center text-center">
          <div className="size-10 rounded bg-[#FDFDFD] flex items-center justify-center border border-[#C4C4C41A]">
            <Icon
              name="upload"
              className="text-[#121212]"
            />
          </div>
          <p className="text-sm font-medium text-[#7F7F7F] mt-3">
            <label
              htmlFor={fileInputId}
              className={`inline ${disabled ? "cursor-not-allowed opacity-60 pointer-events-none" : "cursor-pointer"}`}
            >
              <input
                type="file"
                id={fileInputId}
                ref={fileInputRef}
                name={name}
                onChange={handleFileChange}
                accept=".jpeg, .jpg, .png, .pdf, .doc, .docx"
                multiple={multiple}
                disabled={disabled}
                className="hidden"
              />
              <span className="text-primary font-semibold">Click to upload {multiple ? "files" : "file"}</span>
            </label>
            {" "}
            <span>JPG, PNG or PDF {multiple ? "files" : "file"} (max. 10MB each)</span>
          </p>
          {disabled && disabledHint ? (
            <p className="mt-2 text-xs text-[#7F7F7F]">{disabledHint}</p>
          ) : null}
        </div>

        {isUploading && (
          <div className="mt-4 text-center flex items-center flex-col text-blue-500">
            <Spinner />
            <p className="text-xs mt-2">Uploading...</p>
          </div>
        )}

        {/* Legacy single file display */}
        {!multiple && (uploadedFileName || uploadedServerUrl) && (
          <div className="mt-4 w-full">
            <div className="rounded-lg border border-[#D5E7FB] bg-[#F7FBFF] px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-2.5">
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#E6F4EA] text-[#22A447] text-[10px] font-bold">
                    ✓
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#7F7F7F] leading-none">Uploaded file</p>
                    <p className="mt-1 text-xs text-[#090727] font-semibold truncate">
                      {uploadedFileName || "Selected file"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePreviewFile}
                    disabled={isPreparingPreview}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[#005BB0] text-xs font-semibold hover:bg-[#EAF4FF] disabled:opacity-50"
                  >
                    <Image
                      src="/images/eye-on-dark.svg"
                      alt="preview file"
                      width={14}
                      height={14}
                    />
                    {isPreparingPreview ? "Loading..." : "Preview"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center rounded-md px-2 py-1 text-[#FD2727] text-xs font-semibold hover:bg-[#FFEDEE]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
            {/* {(previewUrl || uploadedServerUrl) && (
              <div className="relative flex items-center justify-center">
                {(() => {
                  const displayUrl = uploadedServerUrl || previewUrl;
                  if (!displayUrl) return null;
                  
                  // Check if it's a PDF by file type, filename, or URL
                  const isPdf = uploadedFile?.type === 'application/pdf' ||
                                displayUrl.toLowerCase().includes('.pdf') || 
                                uploadedFileName?.toLowerCase().endsWith('.pdf') ||
                                (uploadedFile && uploadedFile.name.toLowerCase().endsWith('.pdf'));
                  
                  if (isPdf) {
                    return (
                      <div className="flex flex-col items-center gap-2">
                        <Icon name="file-pdf" className="w-16 h-16 text-red-500" />
                        <a
                          href={displayUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline hover:text-primary/80"
                        >
                          Preview PDF
                        </a>
                      </div>
                    );
                  }
                  
                  // For images, try to display them
                  // If it fails, we'll show a link to view the file
                  return (
                    <div className="relative">
                      <Image 
                        src={displayUrl} 
                        alt={"Preview"} 
                        width={200} 
                        height={200} 
                        className="rounded max-w-full max-h-48 object-contain" 
                        unoptimized={!!previewUrl || displayUrl.startsWith('http')} // Don't optimize blob URLs or external URLs
                      />
                    </div>
                  );
                })()}
                <button
                  onClick={handleDelete}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 cursor-pointer text-white hover:bg-red-600 z-10"
                  type="button"
                >
                  <Icon name="close" className="w-3 h-3" />
                </button>
              </div>
            )} */}
          </div>
        )}
      </div>
      {hasError && (
        <p className="mt-1 text-danger font-medium text-xs">{error}</p>
      )}

      <Modal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewModalUrl(null);
        }}
        title={uploadedFileName ? `Preview - ${uploadedFileName}` : "File Preview"}
        className="!w-[95vw] !max-w-6xl"
      >
        <div className="h-[75vh] w-full">
          {previewModalUrl && previewModalType === "image" && (
            <div className="h-full w-full flex items-center justify-center bg-[#F7F8FA] rounded-md border border-[#C4C4C452]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewModalUrl}
                alt={uploadedFileName || "File preview"}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}

          {previewModalUrl && (previewModalType === "pdf" || previewModalType === "office") && (
            <iframe
              src={previewModalUrl}
              className="h-full w-full rounded-md border border-[#C4C4C452]"
              title="File preview"
            />
          )}

          {previewModalUrl && previewModalType === "unsupported" && (
            <div className="h-full w-full flex flex-col items-center justify-center rounded-md border border-[#C4C4C452] bg-[#F7F8FA] px-6 text-center">
              <p className="text-sm font-semibold text-[#090727] mb-2">Preview not supported for this file type.</p>
              <a
                href={previewModalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#005BB0] underline"
              >
                Open file in new tab
              </a>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default UploadComponent;
