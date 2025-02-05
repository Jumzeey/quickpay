import React, { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { uploadFile } from "@/services/kyc";
import { notifyError } from "@/util/utils";
import { Spinner } from "./Spinner";

interface UploadComponentProps {
  onFileUpload?: (file: string, name: string) => void;
  buttonText?: string;
  name: string;
  text: string;
  folderName?: string;
  setMandateFile?: (value: File) => void;
}

const UploadComponent: React.FC<UploadComponentProps> = ({
  onFileUpload,
  buttonText = "Browse",
  name,
  text,
  folderName,
  setMandateFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      const validFormats = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      const maxSize = 3 * 1024 * 1024;

      if (!validFormats.includes(file.type)) {
        notifyError(
          "Unsupported file format. Please upload a JPG, PNG, or PDF file."
        );
        return;
      }

      if (file.size > maxSize) {
        notifyError("File size exceeds 3MB. Please upload a smaller file.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      folderName && formData.append("folder", folderName);
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
      setUploadedFile(file);

      if (folderName) {
        try {
          setIsUploading(true);
          const response = await uploadFile(formData);
          onFileUpload && onFileUpload(response.data.file, name);
        } catch (error: any) {
          notifyError(error.message);
          URL.revokeObjectURL(fileUrl);
          setPreviewUrl(null);
          setUploadedFile(null);
        } finally {
          setIsUploading(false);
        }
      }
      setUploadedFileName(file.name);
      setMandateFile && setMandateFile(file);
    }
  };

  const handleDelete = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadedFile(null);
    setUploadedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="upload-container mb-5">
      <div className="flex w-full justify-center"></div>
      <div className="flex w-full justify-between mt-5 p-2">
        <div className="flex">
          <Image
            src="/images/dashboard/upload.svg"
            alt="Upload SVG"
            width={50}
            height={50}
            priority
          />
          <div className="ml-3">
            <h6 className="uploadText text-sm">
              {text}
              <span className="text-red-600">*</span>
            </h6>
            <p className="text-xs uploadP mt-1">
              JPG, PNG or PDF, file size no more than 3MB
            </p>
          </div>
        </div>
        <div>
          <button
            onClick={handleButtonClick}
            className="uploadButton text-xs"
            type="button"
          >
            {buttonText.toUpperCase()}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            name={name}
            onChange={handleFileChange}
            accept=".jpeg, .jpg, .png, .pdf"
            className="hidden"
          />
        </div>
      </div>
      {isUploading && (
        <div className="mt-4 text-center text-blue-500">
          <Spinner />
        </div>
      )}
      {uploadedFileName && (
        <div className="mt-4 text-center sarepayPrimary font-bold">
          Uploaded file: {uploadedFileName}
        </div>
      )}
      {previewUrl && (
        <div className="mt-4">
          <div className="relative">
            <Image src={previewUrl} alt={"Preview"} width={100} height={100} />
            <button
              onClick={handleDelete}
              className="absolute top-0 right-0 bg-red-500 rounded-full p-1"
            >
              <Image
                src="/images/dashboard/collections/delete.svg"
                alt="Delete"
                width={10}
                height={10}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadComponent;
