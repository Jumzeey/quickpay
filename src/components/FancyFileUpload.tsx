import React from 'react';

interface FancyFileUploadProps {
  acceptedTypes?: string[];
  documents: any[];
  setDocuments: React.Dispatch<React.SetStateAction<any[]>>;
  maxFileSize?: number; // in MB
  onFilesSelected?: (files: File[]) => void; // Optional callback for compatibility
  multiple?: boolean;
  className?: string;
}

const FancyFileUpload: React.FC<FancyFileUploadProps> = ({
  acceptedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'],
  documents,
  setDocuments,
  maxFileSize = 5, // Default max file size is 5MB
  onFilesSelected,
  multiple = true,
  className = ''
}) => {
  // Trigger file input when clicking the upload zone
  const handleZoneClick = () => {
    document.getElementById('fileInput')?.click();
  };

  // Handle File Upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const validFiles = files.filter(file => {
        const isValidType = acceptedTypes.some(type => 
          type.startsWith('.') ? file.name.toLowerCase().endsWith(type.toLowerCase()) : file.type.includes(type)
        );
        const isValidSize = file.size <= maxFileSize * 1024 * 1024; // Convert MB to bytes
        return isValidType && isValidSize;
      });

      // Call the optional callback if provided (for compatibility)
      if (onFilesSelected) {
        onFilesSelected(validFiles);
      } else {
        // Use the existing pattern
        const newFiles = validFiles.map(file => ({
          file,
          title: file.name, // Default title as file name
          id: Math.random().toString(36).substr(2, 9), // Add unique ID
        }));
        setDocuments((prevFiles: any) => [...prevFiles, ...newFiles]);
      }
    }
  };

  // Handle File Removal
  const removeFile = (index: number) => {
    setDocuments((prevFiles: any) =>
      prevFiles.filter((_: any, i: number) => i !== index)
    );
  };

  // Handle Title Update
  const updateTitle = (index: number, newTitle: string) => {
    setDocuments((prevFiles: any) =>
      prevFiles.map((item: any, i: number) =>
        i === index ? { ...item, title: newTitle } : item
      )
    );
  };

  return (
    <div className={`max-w-lg mx-auto py-2 ${className}`}>
      {/* Clickable Upload Zone */}
      <div
        className='border-dashed border-2 border-gray-400 rounded-lg p-6 flex flex-col items-center justify-center text-gray-600 cursor-pointer bg-gray-50 hover:bg-gray-100 transition'
        onClick={handleZoneClick}
      >
        <input
          type='file'
          id='fileInput'
          className='hidden'
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          onChange={handleFileChange}
        />
        <p className='text-sm'>Click to upload files</p>
      </div>
      <span className='text-xs mt-1 text-black'>
        JPG, PNG or PDF, file size no more than {maxFileSize}MB
      </span>

      {/* Uploaded Files List - ONLY SHOW IF FILES EXIST */}
      {documents.length > 0 && (
        <div className='mt-4 space-y-3'>
          {documents.map((fileObj, index) => {
            // Extract file extension
            const fileExtension =
              fileObj?.file?.name.split('.').pop()?.toUpperCase() || 'FILE';

            return (
              <div
                key={fileObj.id || index}
                className='flex items-center justify-between gap-3 p-3 bg-gray-100 rounded-lg shadow'
              >
                {/* Title Input (Styled - No Borders, Only Outline on Focus) */}
                <input
                  type='text'
                  value={fileObj.title}
                  onChange={e => updateTitle(index, e.target.value)}
                  className='p-2 outline-none border-b border-gray-400 w-2/3 bg-transparent focus:border-blue-500'
                  placeholder='Enter document title'
                />

                {/* File Extension Instead of File Name */}
                <span className='text-sm font-medium text-gray-600'>
                  {fileExtension}
                </span>

                {/* Delete Button with Red Trash Icon */}
                <button
                  type='button'
                  onClick={() => removeFile(index)}
                  className='flex items-center justify-center w-8 h-8 bg-transparent text-danger hover:text-red-700 transition '
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={2}
                    stroke='currentColor'
                    className='w-5 h-5'
                  >
                    <path
                      strokeLinecap='round'
                      d='M3 6h18M9 6V4h6v2m3 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6h12z'
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FancyFileUpload;
