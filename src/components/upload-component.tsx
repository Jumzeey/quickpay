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
import { uploadFile } from "@/services/kyc";
import { notifyError } from "@/util/utils";
import Image from "next/image";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
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

  // New props for multiple file handling
  multiple?: boolean;
  documents?: DocumentWithType[];
  setDocuments?: React.Dispatch<React.SetStateAction<DocumentWithType[]>>;
  maxFiles?: number;
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
  value, // Server URL for existing uploaded file
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Legacy single file state (for backward compatibility)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedServerUrl, setUploadedServerUrl] = useState<string | null>(value || null);

  const [isUploading, setIsUploading] = useState(false);

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
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
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
            // Upload to server
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", folderName);

            try {
              const response = await uploadFile(formData);
              uploadedUrl = response.data.file;
              onFileUpload && onFileUpload(response.data.file, name);
            } catch (error: any) {
              notifyError(`Failed to upload ${file.name}: ${error.message}`);
              continue;
            }
          }

          newDocuments.push({
            id: Math.random().toString(36).substr(2, 9),
            file,
            title: file.name.split('.')[0], // Remove extension for title
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
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", folderName);

          const response = await uploadFile(formData);
          const serverUrl = response.data.file;
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

      <div className="rounded border border-[#C4C4C43D] bg-[#D9D9D90D] p-4 h-auto min-h-[200px] flex flex-col items-center justify-center">
        <div className="w-full flex flex-col items-center justify-center text-center">
          <div className="size-10 rounded bg-[#FDFDFD] flex items-center justify-center border border-[#C4C4C41A]">
            <Icon
              name="upload"
              className="text-[#121212]"
            />
          </div>
          <p className="text-sm font-medium text-[#7F7F7F] mt-3">
            <button
              onClick={handleButtonClick}
              className="text-primary mr-1 cursor-pointer"
              type="button"
            >
              Click to upload {multiple ? 'files' : 'file'}
            </button>
            JPG, PNG or PDF {multiple ? 'files' : 'file'} (max. 10MB each)
          </p>
          <input
            type="file"
            ref={fileInputRef}
            name={name}
            onChange={handleFileChange}
            accept=".jpeg, .jpg, .png, .pdf"
            multiple={multiple}
            className="hidden"
          />
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
            {uploadedFileName && (
              <p className="text-xs text-center text-primary font-semibold mb-2">
                Uploaded file: {uploadedFileName}
              </p>
            )}
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
    </div>
  );
};

export default UploadComponent;
