// import ActionButton from '@/components/action-button';
// import Icon from '@/components/icon';
// import Modal from '@/components/modal';
// import { ExportType, useExportJob } from '@/hooks/useExportJob';
// import React, { useEffect, useState } from 'react';
// import * as Yup from 'yup';

// interface ExportModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     title?: string;
//     exportEndpoint: string;
//     statusEndpoint: string;
//     params?: Record<string, any>;
//     exportType: ExportType;
// }

// type ExportStep = 'get_statement' | 'select_channel' | 'select_file_type' | 'processing' | 'ready_download';

// interface ExportFormData {
//     downloadChannel: string;
//     fileType: string;
// }

// const DOWNLOAD_CHANNELS = [
//     { value: 'email', label: 'Email' },
//     { value: 'download', label: 'Direct Download' },
//     { value: 'cloud', label: 'Cloud Storage' }
// ];

// const FILE_TYPES = [
//     { value: 'pdf', label: 'PDF Document' },
//     { value: 'excel', label: 'Excel Spreadsheet' },
//     { value: 'csv', label: 'CSV File' }
// ];

// const ExportModal: React.FC<ExportModalProps> = ({
//     isOpen,
//     onClose,
//     title = 'Export Data',
//     exportEndpoint,
//     statusEndpoint,
//     params = {},
//     exportType
// }) => {
//     const {
//         startExport,
//         cancelExport,
//         isLoading,
//         status,
//         progress,
//         error,
//         jobId,
//         downloadUrl,
//         isCompleted
//     } = useExportJob();

//     const [currentStep, setCurrentStep] = useState<ExportStep>('get_statement');
//     const [showFileInfo, setShowFileInfo] = useState(false);

//     const validationSchema = Yup.object().shape({
//         downloadChannel: Yup.string().required('Please select a download channel'),
//         fileType: Yup.string().required('Please select a file type')
//     });

//     const { control, handleSubmit, formState: { errors }, watch, reset } = useFormValidation<ExportFormData>(
//         validationSchema,
//         {
//             defaultValues: {
//                 downloadChannel: '',
//                 fileType: ''
//             }
//         }
//     );

//     const selectedChannel = watch('downloadChannel');
//     const selectedFileType = watch('fileType');


//     // Start export when modal opens
//     useEffect(() => {
//         if (isOpen && status === 'idle') {
//             startExport({
//                 exportEndpoint,
//                 statusEndpoint,
//                 params,
//                 exportType
//             });
//         }
//     }, [isOpen, startExport, status, exportEndpoint, statusEndpoint, params, exportType]);

//     // Close modal when export is complete after a delay
//     // useEffect(() => {
//     //     if (isCompleted) {
//     //         const timer = setTimeout(() => {
//     //             onClose();
//     //         }, 3000);
//     //         return () => clearTimeout(timer);
//     //     }
//     // }, [isCompleted, onClose]);

//     const handleClose = () => {
//         // Don't cancel if completed
//         if (status !== 'completed') {
//             cancelExport();
//         }
//         onClose();
//     };

//     const handleDownloadClick = () => {
//         if (downloadUrl) {
//             window.open(downloadUrl, '_blank', 'noopener,noreferrer');
//         }
//     };

//     // Get filename from URL
//     const getFileName = () => {
//         if (!downloadUrl) return null;
//         try {
//             const url = new URL(downloadUrl);
//             const pathSegments = url.pathname.split('/');
//             return pathSegments[pathSegments.length - 1];
//         } catch {
//             return 'file';
//         }
//     };

//     const getStatusText = () => {
//         switch (status) {
//             case 'pending':
//                 return 'Starting export...';
//             case 'polling':
//                 return 'Preparing your export...';
//             case 'completed':
//                 return 'Export completed successfully!';
//             case 'failed':
//                 return `Export failed: ${error}`;
//             default:
//                 return 'Preparing to export...';
//         }
//     };

//     return (
//         <Modal isOpen={isOpen} onClose={handleClose} title={title}>
//             <div className="mt-1 flex flex-col items-center justify-center py-6">
//                 {/* Status Icon */}
//                 <div className="mb-2">
//                     {isLoading && (
//                         <Icon name="loader" width="40" height="40" className="animate-spin text-primary" />
//                     )}

//                     {isCompleted && (
//                         <div className="text-success h-12 w-12 flex items-center justify-center border rounded-full">
//                             <Icon name="green-check" width="40" height="40" />
//                         </div>
//                     )}

//                     {status === 'failed' && (
//                         <div className="text-danger h-12 w-12 flex items-center justify-center border rounded-full">
//                             <Icon name="close-menu" width="40" height="40" />
//                         </div>
//                     )}
//                 </div>

//                 {/* Status Text */}
//                 <p className="text-center text-base font-medium mb-4">{getStatusText()}</p>

//                 {/* Progress Bar */}
//                 {isLoading && (
//                     <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 mt-2">
//                         <div
//                             className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out"
//                             style={{ width: `${progress}%` }}
//                         ></div>
//                     </div>
//                 )}

//                 {/* Info Text */}
//                 {isLoading && (
//                     <p className="text-gray-500 text-sm text-center mt-2 mb-6">
//                         {progress > 0 ? `${progress}% complete` : 'This may take a few moments...'}
//                     </p>
//                 )}

//                 {/* File Information Card (when completed) */}
//                 {isCompleted && downloadUrl && (
//                     <div className="w-full max-w-md mb-6">
//                         <div className="bg-gray-50 border border-primary/10 rounded-lg p-4">
//                             <div className="flex items-center">
//                                 <div className="mr-3 text-primary">
//                                     <Icon
//                                         name="file-excel"
//                                         width="40"
//                                         height="40"
//                                         className="size-full"
//                                     />
//                                 </div>
//                                 <div className="flex-1">
//                                     <p className="font-semibold text-sm text-gray-800 truncate text-wrap">
//                                         {getFileName() || 'Export file'}
//                                     </p>
//                                     <p className="text-[10px] text-gray-500 font-medium">
//                                         Ready to download
//                                     </p>
//                                 </div>
//                                 <button
//                                     onClick={() => setShowFileInfo(!showFileInfo)}
//                                     className="text-gray-400 hover:text-gray-600"
//                                     aria-label="Toggle file details"
//                                 >
//                                     <Icon name={showFileInfo ? "chevron-up" : "chevron-down"} className="h-5 w-5" />
//                                 </button>
//                             </div>

//                             {showFileInfo && (
//                                 <div className="mt-3 pt-3 border-t border-gray-200">
//                                     <p className="text-xs text-gray-600 break-all">
//                                         {downloadUrl}
//                                     </p>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 )}

//                 {/* Action Buttons */}
//                 <div className="flex gap-4 mt-4 w-3/4">
//                     {isCompleted ? (
//                         <>
//                             <ActionButton
//                                 text="Download"
//                                 ariaLabel="Download export file"
//                                 className="w-full text-center justify-center"
//                                 onClick={handleDownloadClick}
//                             />
//                             <ActionButton
//                                 text="Close"
//                                 ariaLabel="Close export modal"
//                                 onClick={handleClose}
//                                 className="w-full text-center justify-center bg-[#EB575710] !text-danger"
//                             />
//                         </>
//                     ) : (
//                         <>
//                             {status === 'failed' ? (
//                                 <ActionButton
//                                     text="Try Again"
//                                     ariaLabel="Retry export"
//                                     className="w-full text-center justify-center"
//                                     onClick={() => startExport({
//                                         exportEndpoint,
//                                         statusEndpoint,
//                                         params,
//                                         exportType
//                                     })}
//                                 />
//                             ) : null}

//                             <ActionButton
//                                 text="Cancel"
//                                 ariaLabel="Cancel export"
//                                 className="bg-[#EB575710] !text-danger w-full text-center justify-center"
//                                 onClick={handleClose}
//                             />
//                         </>
//                     )}
//                 </div>
//             </div>
//         </Modal>
//     );
// };

// export default ExportModal;

import ActionButton from '@/components/action-button';
import Icon from '@/components/icon';
import Modal from '@/components/modal';
import { ExportType, useExportJob } from '@/hooks/useExportJob';
import { useFormValidation } from '@/hooks/useFormValidation';
import { formatDate } from '@/util/utils';
import Image from "next/image";
import React, { useEffect, useState } from 'react';
import { DateRangePicker } from 'react-date-range';
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { Controller } from 'react-hook-form';
import * as Yup from 'yup';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    exportEndpoint: string;
    statusEndpoint: string;
    params?: Record<string, any>;
    exportType: ExportType;
}

type ExportStep = 'get_statement' | 'select_channel' | 'select_file_type' | 'processing' | 'ready_download';

interface ExportFormData {
    downloadChannel: string;
    fileType: string;
}

const DOWNLOAD_CHANNELS = [
    { value: 'email', label: 'Email' },
    { value: 'download', label: 'Direct Download' },
    { value: 'cloud', label: 'Cloud Storage' }
];

const FILE_TYPES = [
    { value: 'pdf', label: 'PDF Document' },
    { value: 'excel', label: 'Excel Spreadsheet' },
    { value: 'csv', label: 'CSV File' }
];

const initialSelectionDate = {
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
}

const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    title = 'Export Data',
    exportEndpoint,
    statusEndpoint,
    params = {},
    exportType
}) => {
    const {
        startExport,
        cancelExport,
        isLoading,
        status,
        progress,
        error,
        jobId,
        downloadUrl,
        isCompleted
    } = useExportJob();
    const [selectionRange, setSelectionRange] = useState(initialSelectionDate)
    const [currentStep, setCurrentStep] = useState<ExportStep>('get_statement');

    const validationSchema = Yup.object().shape({
        downloadChannel: Yup.string().required('Please select a download channel'),
        fileType: Yup.string().required('Please select a file type')
    });

    const {
        control,
        handleSubmit,
        getValues,
        formState: { errors },
        watch,
        reset
    } = useFormValidation<ExportFormData>(
        validationSchema,
        {
            defaultValues: {
                downloadChannel: '',
                fileType: ''
            }
        }
    );

    console.log({ errors, values: getValues() });

    const selectedChannel = watch('downloadChannel');
    const selectedFileType = watch('fileType');

    // Reset modal state when opened
    useEffect(() => {
        if (isOpen) {
            setCurrentStep('get_statement');
            reset();
        }
    }, [isOpen, reset]);

    // Handle export status changes
    useEffect(() => {
        if (status === 'pending' || status === 'polling') {
            setCurrentStep('processing');
        } else if (status === 'completed' && downloadUrl) {
            setCurrentStep('ready_download');
        } else if (status === 'failed') {
            // Stay on current step to show error
        }
    }, [status, downloadUrl]);

    const handleClose = () => {
        // Don't cancel if completed
        if (status !== 'completed') {
            cancelExport();
        }
        setCurrentStep('get_statement');
        reset();
        onClose();
    };

    const handleGetStatement = () => {
        setCurrentStep('select_channel');
    };

    const handleChannelSubmit = () => {
        if (selectedChannel) {
            setCurrentStep('select_file_type');
        }
    };

    const handleFileTypeSubmit = (data: ExportFormData) => {
        console.log({ selectionRange })
        if (data.downloadChannel && data.fileType) {
            setCurrentStep('processing');

            // Start the actual export with selected parameters
            const exportParams = {
                ...params,
                download_channel: data.downloadChannel,
                file_type: data.fileType,
                start_date: formatDate(selectionRange.startDate),
                end_date: formatDate(selectionRange.endDate)
            };

            startExport({
                exportEndpoint,
                statusEndpoint,
                params: exportParams,
                exportType
            });
        }
    };

    const handleDownloadClick = () => {
        if (downloadUrl) {
            window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const handleRetry = () => {
        setCurrentStep('get_statement');
        reset();
    };

    // Get filename from URL
    const getFileName = () => {
        if (!downloadUrl) return null;
        try {
            const url = new URL(downloadUrl);
            const pathSegments = url.pathname.split('/');
            return pathSegments[pathSegments.length - 1];
        } catch {
            return 'exported_file';
        }
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 'get_statement':
                return 'Get Account Statement';
            case 'select_channel':
                return 'Download Channel';
            case 'select_file_type':
                return 'Download File As...';
            case 'processing':
                return '';
            case 'ready_download':
                return 'File Ready!';
            default:
                return title;
        }
    };

    const handleDateChange = (range: any) => {
        setSelectionRange(range.selection)
    }

    const renderGetStatement = () => (
        <div className="text-center py-8">
            <div className="mb-6">
                <DateRangePicker
                    onChange={handleDateChange}
                    moveRangeOnFirstSelection={false}
                    months={2}
                    ranges={[selectionRange]}
                    direction="horizontal"
                    color="#000"
                    rangeColors={["#164988"]}
                    staticRanges={[]}
                />
            </div>

            <div className="w-1/2 flex gap-3 items-center justify-end justify-self-end">
                <ActionButton
                    text="Cancel"
                    ariaLabel="Continue to channel selection"
                    className="w-full text-center justify-center !text-[#7F7F7F]"
                    onClick={handleClose}
                />
                <ActionButton
                    text="Apply"
                    ariaLabel="Continue to channel selection"
                    className="w-full text-center justify-center bg-primary !text-white"
                    onClick={handleGetStatement}
                />
            </div>
        </div>
    );

    const renderSelectChannel = () => (
        <div className="py-6">
            <label className="space-y-4">
                <Controller
                    name="downloadChannel"
                    control={control}
                    render={({ field }) => (
                        <div className="border border-[#7F7F7F33] rounded-[10px] w-full p-8 flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-4">
                                <Icon name="download2" width="24" height="24" className="text-gray-600" />
                                <p className="font-semibold text-sm text-black">Download to device</p>
                            </div>
                            <input
                                type="radio"
                                id="downloadChannel"
                                value="download"
                                checked={field.value === 'download'}
                                onChange={() => field.onChange('download')}
                                className="form-radio h-5 w-5 text-primary"
                            />
                        </div>
                    )}
                />

                {/* <Controller
                    name="downloadChannel"
                    control={control}
                    render={({ field }) => (
                        <FormSelect
                            label="Download Channel"
                            id="downloadChannel"
                            htmlFor="downloadChannel"
                            error={errors.downloadChannel?.message}
                            touched={!!errors.downloadChannel}
                            options={DOWNLOAD_CHANNELS}
                            placeholder="Select download method"
                            {...field}
                        />
                    )}
                /> */}
            </label>

            <div className="w-1/4 mt-6 flex gap-3 items-center justify-end justify-self-end">
                <ActionButton
                    text="Apply"
                    ariaLabel="Continue to file type selection"
                    className="w-full text-center justify-center bg-primary !text-white"
                    onClick={handleChannelSubmit}
                    disabled={!selectedChannel}
                />
            </div>
        </div>
    );

    const renderSelectFileType = () => (
        <form onSubmit={handleSubmit(handleFileTypeSubmit)} className="py-6">
            <div className="space-y-4 mb-6">
                <Controller
                    name="fileType"
                    control={control}
                    render={({ field }) => (
                        <label htmlFor="fileType" className="border border-[#7F7F7F33] rounded-[10px] w-full p-8 flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-4">
                                <Icon name="file-excel2" width="24" height="24" className="text-gray-600" />
                                <p className="font-semibold text-sm text-black">Excel file format</p>
                            </div>
                            <input
                                type="radio"
                                id="fileType"
                                value="excel"
                                checked={field.value === 'excel'}
                                onChange={() => field.onChange('excel')}
                                className="form-radio h-5 w-5 text-primary"
                            />
                        </label>
                    )}
                />

                {/* <Controller
                    name="fileType"
                    control={control}
                    render={({ field }) => (
                        <FormSelect
                            label="File Type"
                            id="fileType"
                            htmlFor="fileType"
                            error={errors.fileType?.message}
                            touched={!!errors.fileType}
                            options={FILE_TYPES}
                            placeholder="Select file format"
                            {...field}
                        />
                    )}
                /> */}
            </div>

            {/* <div className="flex gap-4 w-3/4 mx-auto">
                <ActionButton
                    text="Back"
                    ariaLabel="Go back to channel selection"
                    className="w-full text-center justify-center bg-[#EB575710] !text-danger"
                    onClick={() => setCurrentStep('select_channel')}
                />
                <ActionButton
                    text="Generate Export"
                    ariaLabel="Start generating export"
                    className="w-full text-center justify-center"
                    type="submit"
                    disabled={!selectedFileType}
                />
            </div> */}
            <div className="w-1/2 flex gap-3 items-center justify-end justify-self-end">
                <ActionButton
                    text="Generate account statement"
                    ariaLabel="Start generating export"
                    className="w-full text-center justify-center bg-primary !text-white"
                    type="submit"
                    disabled={!selectedFileType}
                />
            </div>
        </form>
    );

    const renderProcessing = () => (
        <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-3">
                {status === 'failed' && 'Export Failed'}
            </h3>

            {status === 'failed' ? (
                <>
                    <p className="text-red-600 mb-6 text-sm">
                        {error || 'Something went wrong while generating your export.'}
                    </p>
                    <div className="w-3/4 mx-auto flex gap-4">
                        <ActionButton
                            text="Try Again"
                            ariaLabel="Retry export"
                            className="w-full text-center justify-center"
                            onClick={handleRetry}
                        />
                        <ActionButton
                            text="Cancel"
                            ariaLabel="Cancel export"
                            className="w-full text-center justify-center bg-[#EB575710] !text-danger"
                            onClick={handleClose}
                        />
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center justify-center mb-6 h-52">
                        <Image
                            src="/images/ramp-logo.svg"
                            width={83}
                            height={40}
                            alt="Ramp Logo"
                            priority
                            className="animate-pulse"
                        />
                    </div>
                    <div className="">
                        <p className="text-[#7F7F7F] font-semibold text-sm w-1/2 mx-auto mb-6">
                            Generating account statement
                            Please wait
                            <br />
                            ...
                        </p>
                    </div>
                </>
            )}
        </div>
    );

    const renderReadyDownload = () => (
        <div className="text-center py-8">

            {/* File Information Card */}
            {downloadUrl && (
                <div className="w-full max-w-md mx-auto">
                    <div className="flex items-center justify-center">
                        <Icon
                            name="download"
                            width="60"
                            height="60"
                            color="#005BB0"
                        />
                    </div>

                    <p className="font-semibold text-sm text-primary truncate my-10">
                        {getFileName() || 'Export file'}
                    </p>
                </div>
            )}

            <div className="flex gap-4 w-1/3 mx-auto">
                <ActionButton
                    text="Download File"
                    ariaLabel="Download export file"
                    className="w-full text-center justify-center bg-primary !text-white"
                    onClick={handleDownloadClick}
                />
                {/* <ActionButton
                    text="Close"
                    ariaLabel="Close export modal"
                    onClick={handleClose}
                    className="w-full text-center justify-center bg-[#EB575710] !text-danger"
                /> */}
            </div>
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 'get_statement':
                return renderGetStatement();
            case 'select_channel':
                return renderSelectChannel();
            case 'select_file_type':
                return renderSelectFileType();
            case 'processing':
                return renderProcessing();
            case 'ready_download':
                return renderReadyDownload();
            default:
                return renderGetStatement();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={getStepTitle()} width={currentStep === 'get_statement'}>
            <div className="mt-1">
                {renderCurrentStep()}
            </div>
        </Modal>
    );
};

export default ExportModal;