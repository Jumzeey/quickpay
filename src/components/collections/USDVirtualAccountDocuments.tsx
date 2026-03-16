import React, { useCallback, useEffect, useRef, useState } from 'react';
import Button from '@/components/button';
import FormSelect from '@/components/FormSelect';
import Icon from '@/components/icon';
import Loader from '@/components/loader';
import { notifyError, notifySuccess, uuid } from '@/util/utils';
import ActionButton from '../action-button';
import FormInput from '../FormInput';
import { uploadFileByConfig } from '@/util/uploadFileByConfig';

interface UploadedDoc {
  id: string;
  file: File;
  selectedType?: string;
  uploadUrl?: string;
  uploadedFileUrl?: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  label?: string;
}

interface Props {
  type: string;
  onDocumentsUploaded: (docs: { type: string; url: string; label?: string }[]) => void;
}

const USDVirtualAccountDocuments: React.FC<Props> = ({
  type,
  onDocumentsUploaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<UploadedDoc[]>([]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.uploadUrl && file.uploadUrl.startsWith('blob:')) {
          URL.revokeObjectURL(file.uploadUrl);
        }
      });
    };
  }, [files]);

  const documentOptions =
    type === 'individual'
      ? [
          { value: 'government_id', label: 'Government ID' },
          { value: 'proof_of_address', label: 'Proof of Address' },
          { value: 'tax_identification', label: 'Tax Identification' },
          { value: 'source_of_funds', label: 'Source of Funds' },
        ]
      : [
          {
            value: 'certificate_of_incorporation',
            label: 'Certificate of Incorporation',
          },
          { value: 'tax_certificate', label: 'Tax Certificate' },
          {
            value: 'proof_of_registered_address',
            label: 'Proof of Registered Address',
          },
          { value: 'shareholder_register', label: 'Shareholder Register' },
          { value: 'beneficial_owner_ids', label: 'Beneficial Owner IDs' },
          { value: 'director_id', label: 'Director ID' },
        ];

  const handleFileSelection = (newFiles: FileList | null) => {
    if (!newFiles) return;
    
    // Validate file types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    
    const validFiles = Array.from(newFiles)
      .filter(file => {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
        
        if (!isValidType) {
          notifyError(`File "${file.name}" is not a valid type. Only PDF, JPG, JPEG, and PNG files are allowed.`);
          return false;
        }
        
        // Check file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
          notifyError(`File "${file.name}" is too large. Maximum size is 10MB.`);
          return false;
        }
        
        return true;
      })
      .map(file => ({
        id: uuid(),
        file,
        status: 'pending' as const,
      }));
    
    if (validFiles.length === 0) return;
    
    console.log('Adding new files:', validFiles);
    setFiles(prev => {
      const updated = [...prev, ...validFiles];
      console.log('Updated files state:', updated);
      return updated;
    });
    
    // Reset the file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) =>
    e.preventDefault();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileSelection(e.dataTransfer.files);
  };

  const handleFileRemove = (id: string) =>
    setFiles(prev => prev.filter(f => f.id !== id));

  const handleFileUpload = async (fileObj: UploadedDoc) => {
    // Validate that document type is selected
    if (!fileObj.selectedType) {
      notifyError('Please select a document type before uploading');
      return;
    }

    try {
      setFiles(prev =>
        prev.map(f =>
          f.id === fileObj.id ? { ...f, status: 'uploading' as const } : f
        )
      );

      const uploadedUrl = await uploadFileByConfig(
        fileObj.file,
        'usd-virtual-account-documents'
      );

      setFiles(prev => {
        const updated = prev.map(f =>
          f.id === fileObj.id
            ? {
                ...f,
                status: 'uploaded' as UploadedDoc['status'],
                uploadUrl: uploadedUrl,
                uploadedFileUrl: uploadedUrl,
              }
            : f
        );

        onDocumentsUploaded(
          updated
            .filter(f => f.status === 'uploaded' && f.selectedType && f.uploadedFileUrl)
            .map(f => ({
              type: f.selectedType!,
              url: f.uploadedFileUrl!,
              label: f.label,
            }))
        );

        return updated;
      });

      notifySuccess('Document uploaded successfully');
    } catch (error: any) {
      console.error('Error marking file as uploaded:', error);
      setFiles(prev =>
        prev.map(f =>
          f.id === fileObj.id ? { ...f, status: 'error' as const } : f
        )
      );
      notifyError(error?.message || 'Failed to upload document');
    }
  };

  const handleViewFile = (url: string) => window.open(url, '_blank');

  const handleDeleteUploaded = (id: string) => {
    setFiles(prev => {
      // Find the file to revoke its blob URL
      const fileToDelete = prev.find(f => f.id === id);
      if (fileToDelete?.uploadUrl && fileToDelete.uploadUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileToDelete.uploadUrl);
      }
      
      const updated = prev.filter(f => f.id !== id);
      
      // Sync after deletion
      onDocumentsUploaded(
        updated
          .filter(f => f.status === 'uploaded' && f.selectedType && f.uploadedFileUrl)
          .map(f => ({
            type: f.selectedType!,
            url: f.uploadedFileUrl!,
            label: f.label,
          }))
      );
      
      return updated;
    });
  };

  const uploadedFiles = files.filter(f => f.status === 'uploaded');
  const pendingFiles = files.filter(
    f =>
      f.status === 'pending' || f.status === 'uploading' || f.status === 'error'
  );
  
  console.log('All files:', files);
  console.log('Pending files:', pendingFiles);
  console.log('Uploaded files:', uploadedFiles);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
    return `${size} ${sizes[i]}`;
  };

  return (
    <div className='flex flex-col gap-8 mt-6'>
      {/* Dropzone Section */}
      <section
        className='border-2 border-dashed border-[#00000033] rounded-lg p-6 text-center bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition flex flex-col items-center gap-4 w-2/3'
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type='file'
          multiple
          accept='.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'
          className='hidden'
          onChange={e => handleFileSelection(e.target.files)}
        />
        <Icon name='image-2' className='text-primary' size='36' />
        <ActionButton
          ariaLabel='Select Files'
          text='Select files'
          onClick={e => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        />
        <p className='text-sm font-medium text-[#7F7F7F]'>
          Or drag and drop them here...
        </p>
        <div className='flex items-center flex-col gap-1 text-[13px] text-primary bg-[#005BB01A] px-5 py-7 rounded-md font-medium'>
          <p className='font-bold'>Important:</p>
          <span>
            Please upload your company registration documents. These documents are required to create your USD Virtual Account, which will be used to receive and process international payments.
          </span>
        </div>

        <p className='text-[11px] font-medium text-[#7F7F7F]'>
          PDF, JPG, JPEG, PNG up to 10MB each
        </p>
      </section>

      {/* Pending Uploads Section */}
      {pendingFiles.length > 0 && (
        <section>
          <h3 className='text-sm mb-4 font-semibold'>Documents to upload:</h3>
          <div className='flex flex-col gap-4 w-2/3'>
            {pendingFiles.map(fileObj => (
              <div
                key={fileObj.id}
                className='border border-[#0000000D] rounded-lg py-4 px-8 bg-white shadow-sm flex flex-col gap-3'
              >
                <div className='flex justify-between items-center'>
                  <div className='flex items-center gap-3'>
                    <Icon name='document' />
                    <div className='flex flex-col'>
                      <p className='font-semibold text-sm text-gray-800 truncate'>
                        {fileObj.file.name}
                      </p>
                      <span className='text-xs text-gray-500'>
                        {formatFileSize(fileObj.file.size)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleFileRemove(fileObj.id)}
                    className='text-xs text-danger hover:underline'
                  >
                    Remove
                  </button>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <FormSelect
                    id={`select-${fileObj.id}`}
                    htmlFor={`select-${fileObj.id}`}
                    label='Document Type'
                    options={documentOptions}
                    value={fileObj.selectedType || ''}
                    onChange={e =>
                      setFiles(prev =>
                        prev.map(f =>
                          f.id === fileObj.id
                            ? { ...f, selectedType: e.target.value }
                            : f
                        )
                      )
                    }
                  />

                  <FormInput
                    id={`label-${fileObj.id}`}
                    htmlFor={`label-${fileObj.id}`}
                    label='Document Label (optional)'
                    type='text'
                    placeholder='Enter label'
                    value={fileObj.label || ''}
                    onChange={e =>
                      setFiles(prev =>
                        prev.map(f =>
                          f.id === fileObj.id
                            ? { ...f, label: e.target.value }
                            : f
                        )
                      )
                    }
                  />
                </div>

                <div className='flex justify-end mt-3'>
                  <button
                    className='flex items-center justify-center gap-1 text-white mt-3 text-[12px] px-3 py-1.5 rounded bg-primary hover:bg-primary-dark transition-all duration-200 disabled:opacity-60'
                    disabled={fileObj.status === 'uploading' || !fileObj.selectedType}
                    aria-label='Upload Document'
                    onClick={() => handleFileUpload(fileObj)}
                  >
                    {fileObj.status === 'uploading' ? (
                      <Loader />
                    ) : (
                      <>
                        <Icon name='cloud-upload' className='text-white' />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Uploaded Documents Section */}
      {uploadedFiles.length > 0 && (
        <section>
          <h3 className='text-sm mb-4 font-semibold'>Uploaded documents:</h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
            {uploadedFiles.map(fileObj => {
              // determine label
              const selectedOption = documentOptions.find(
                opt => opt.value === fileObj.selectedType
              );
              const documentName =
                fileObj.label && fileObj.label.trim() !== ''
                  ? fileObj.label
                  : selectedOption?.label || fileObj.selectedType;

              return (
                <div
                  key={fileObj.id}
                  className='border border-[#0000000D] rounded-lg py-4 px-6 bg-white shadow-sm flex items-center gap-4'
                >
                  {/* Left Icon */}
                  <Icon name='document-2' />

                  {/* Content */}
                  <div className='flex-1 flex flex-col gap-1'>
                    <p className='font-semibold text-sm text-black'>
                      {documentName}
                    </p>

                    <div className='flex items-center gap-1 text-[#2BD325] text-xs font-semibold'>
                      <span>File uploaded</span>
                      <Icon name='check' />
                    </div>

                    <div className='flex items-center gap-3 mt-1 text-xs font-medium'>
                      <button
                        onClick={() => handleViewFile(fileObj.uploadUrl!)}
                        className='text-primary underline'
                      >
                        View Document
                      </button>
                      <span className='w-px h-4 bg-grey-300' />
                      <button
                        onClick={() => handleDeleteUploaded(fileObj.id)}
                        className='text-danger underline'
                      >
                        Delete Document
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default USDVirtualAccountDocuments;
