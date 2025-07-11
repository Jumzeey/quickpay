import Icon from "@/components/icon";
import { uploadFile } from "@/services/kyc";
import { notifyError } from "@/util/utils";
import Image from "next/image";
import React, { ChangeEvent, useRef, useState } from "react";
import { Spinner } from "./Spinner";

interface UploadComponentProps {
  onFileUpload?: (file: string, name: string) => void;
  buttonText?: string;
  name: string;
  text: string;
  folderName?: string;
  setMandateFile?: (value: File) => void;
  className?: string;
}

const UploadComponent: React.FC<UploadComponentProps> = ({
  onFileUpload,
  buttonText = "Browse",
  name,
  text,
  folderName,
  setMandateFile,
  className = "",
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
    <div className={className}>
      <p className="text-black text-sm font-semibold mb-0.5">{text}</p>

      <div className="rounded border border-[#C4C4C43D] bg-[#D9D9D90D] p-4 h-[90%] flex flex-col items-center justify-center">
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
              Click to upload
            </button>
            JPG, PNG or PDF file (max. 3MB)
          </p>
          <input
            type="file"
            ref={fileInputRef}
            name={name}
            onChange={handleFileChange}
            accept=".jpeg, .jpg, .png, .pdf"
            className="hidden"
          />
        </div>
        {isUploading && (
          <div className="mt-4 text-center text-blue-500">
            <Spinner />
          </div>
        )}
        {uploadedFileName && (
          <p className="mt-4 text-xs text-center sarepayPrimary font-semibold">
            Uploaded file: {uploadedFileName}
          </p>
        )}
        {previewUrl && (
          <div className="mt-4 relative border border-danger">
            <Image src={previewUrl} alt={"Preview"} width={100} height={100} />
            <button
              onClick={handleDelete}
              className="absolute top-0 right-0 bg-red-500 rounded-full p-1 cursor-pointer"
            >
              <Image
                src="/images/dashboard/collections/delete.svg"
                alt="Delete"
                width={10}
                height={10}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadComponent;
