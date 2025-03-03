import React from "react";

const FancyFileUpload: React.FC<{ documents: any[], setDocuments: any }> = ({ documents, setDocuments }) => {
  // Trigger file input when clicking the upload zone
  const handleZoneClick = () => {
    document.getElementById("fileInput")?.click();
  };

  // Handle File Upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map((file) => ({
        file,
        title: file.name, // Default title as file name
      }));
      setDocuments((prevFiles: any) => [...prevFiles, ...newFiles]);
    }
  };

  // Handle File Removal
  const removeFile = (index: number) => {
    setDocuments((prevFiles: any) => prevFiles.filter((_: any, i: number) => i !== index));
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
    <div className="max-w-lg mx-auto">
      {/* Clickable Upload Zone */}
      <div
        className="border-dashed border-2 border-gray-400 rounded-lg p-6 flex flex-col items-center justify-center text-gray-600 cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
        onClick={handleZoneClick}
      >
        <input
          type="file"
          id="fileInput"
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
          multiple
          onChange={handleFileChange}
        />
        <p className="text-sm">Click to upload files</p>
      </div>

      {/* Uploaded Files List - ONLY SHOW IF FILES EXIST */}
      {documents.length > 0 && (
        <div className="mt-4 space-y-3">
          {documents.map((fileObj, index) => {
            // Extract file extension
            const fileExtension = fileObj?.file?.name.split('.').pop()?.toUpperCase() || "FILE";

            return (
              <div
                key={index}
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
                      strokeLinejoin='round'
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
