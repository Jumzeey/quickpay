import React, { useCallback, useRef, useState } from 'react';
import Button from '@/components/button';
import FormSelect from '@/components/FormSelect';
import Icon from '@/components/icon';
import Loader from '@/components/loader';
import { notifyError, notifySuccess, uuid } from '@/util/utils';
import ActionButton from '../action-button';
import FormInput from '../FormInput';

interface UploadedDoc {
  id: string;
  file: File;
  selectedType?: string;
  uploadUrl?: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  label?: string;
}

interface Props {
  type: string;
  onDocumentsUploaded: (docs: { type: string; file: File }[]) => void;
}

const USDVirtualAccountDocuments: React.FC<Props> = ({
  type,
  onDocumentsUploaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<UploadedDoc[]>([]);

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
    const validFiles = Array.from(newFiles).map(file => ({
      id: uuid(),
      file,
      status: 'pending' as const,
    }));
    setFiles(prev => [...prev, ...validFiles]);
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
    try {
      setFiles(prev => {
        const updated = prev.map(f =>
          f.id === fileObj.id
            ? { ...f, status: 'uploaded' as UploadedDoc['status'] }
            : f
        );

        // Sync after updating
        onDocumentsUploaded(
          updated
            .filter(f => f.status === 'uploaded' && f.selectedType && f.file)
            .map(f => ({
              type: f.selectedType!,
              file: f.file!,
            }))
        );

        return updated;
      });
    } catch (error: any) {
      console.error('Error marking file as uploaded:', error);
      notifyError('Failed to mark document as uploaded');
    }
  };

  const handleViewFile = (url: string) => window.open(url, '_blank');

  const handleDeleteUploaded = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadedFiles = files.filter(f => f.status === 'uploaded');
  const pendingFiles = files.filter(
    f =>
      f.status === 'pending' || f.status === 'uploading' || f.status === 'error'
  );

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
          <h3 className='text-sm mb-4'>Selected documents:</h3>
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
                    disabled={fileObj.status === 'uploading'}
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
          <h3 className='text-sm mb-4'>Selected documents:</h3>
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
