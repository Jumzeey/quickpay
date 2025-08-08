import Button from '@/components/button';
import Icon from '@/components/icon';
import Modal from '@/components/modal';
import { ExportType, useExportJob } from '@/hooks/useExportJob';
import React, { useEffect, useState } from 'react';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    exportEndpoint: string;
    statusEndpoint: string;
    params?: Record<string, any>;
    exportType: ExportType;
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
    const [showFileInfo, setShowFileInfo] = useState(false);

    // Start export when modal opens
    useEffect(() => {
        if (isOpen && status === 'idle') {
            startExport({
                exportEndpoint,
                statusEndpoint,
                params,
                exportType
            });
        }
    }, [isOpen, startExport, status, exportEndpoint, statusEndpoint, params, exportType]);

    // Close modal when export is complete after a delay
    // useEffect(() => {
    //     if (isCompleted) {
    //         const timer = setTimeout(() => {
    //             onClose();
    //         }, 3000);
    //         return () => clearTimeout(timer);
    //     }
    // }, [isCompleted, onClose]);

    const handleClose = () => {
        // Don't cancel if completed
        if (status !== 'completed') {
            cancelExport();
        }
        onClose();
    };

    const handleDownloadClick = () => {
        if (downloadUrl) {
            window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        }
    };

    // Get filename from URL
    const getFileName = () => {
        if (!downloadUrl) return null;
        try {
            const url = new URL(downloadUrl);
            const pathSegments = url.pathname.split('/');
            return pathSegments[pathSegments.length - 1];
        } catch {
            return 'file';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'pending':
                return 'Starting export...';
            case 'polling':
                return 'Preparing your export...';
            case 'completed':
                return 'Export completed successfully!';
            case 'failed':
                return `Export failed: ${error}`;
            default:
                return 'Preparing to export...';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            <div className="mt-1 flex flex-col items-center justify-center py-6">
                {/* Status Icon */}
                <div className="mb-2">
                    {isLoading && (
                        <Icon name="loader" width="40" height="40" className="animate-spin text-primary" />
                    )}

                    {isCompleted && (
                        <div className="text-success h-12 w-12 flex items-center justify-center border rounded-full">
                            <Icon name="green-check" width="40" height="40" />
                        </div>
                    )}

                    {status === 'failed' && (
                        <div className="text-danger h-12 w-12 flex items-center justify-center border rounded-full">
                            <Icon name="close-menu" width="40" height="40" />
                        </div>
                    )}
                </div>

                {/* Status Text */}
                <p className="text-center text-base font-medium mb-4">{getStatusText()}</p>

                {/* Progress Bar */}
                {isLoading && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 mt-2">
                        <div
                            className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}

                {/* Info Text */}
                {isLoading && (
                    <p className="text-gray-500 text-sm text-center mt-2 mb-6">
                        {progress > 0 ? `${progress}% complete` : 'This may take a few moments...'}
                    </p>
                )}

                {/* File Information Card (when completed) */}
                {isCompleted && downloadUrl && (
                    <div className="w-full max-w-md mb-6">
                        <div className="bg-gray-50 border border-primary rounded-lg p-4">
                            <div className="flex items-center">
                                <div className="mr-3 text-primary">
                                    <Icon
                                        name="file-excel"
                                        width="40"
                                        height="40"
                                        className="size-full"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm text-gray-800 truncate text-wrap">
                                        {getFileName() || 'Export file'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        Ready to download
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowFileInfo(!showFileInfo)}
                                    className="text-gray-400 hover:text-gray-600"
                                    aria-label="Toggle file details"
                                >
                                    <Icon name={showFileInfo ? "chevron-up" : "chevron-down"} className="h-5 w-5" />
                                </button>
                            </div>

                            {showFileInfo && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs text-gray-600 break-all">
                                        {downloadUrl}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 mt-4">
                    {isCompleted ? (
                        <>
                            <Button
                                primary
                                text="Download"
                                // icon="download"
                                ariaLabel="Download export file"
                                onClick={handleDownloadClick}
                                className="px-6"
                            />
                            <Button
                                text="Close"
                                ariaLabel="Close export modal"
                                onClick={handleClose}
                                className="px-6"
                            />
                        </>
                    ) : (
                        <>
                            {status === 'failed' ? (
                                <Button
                                    primary
                                    text="Try Again"
                                    ariaLabel="Retry export"
                                    onClick={() => startExport({
                                        exportEndpoint,
                                        statusEndpoint,
                                        params,
                                        exportType
                                    })}
                                    className="px-6"
                                />
                            ) : null}
                            <Button
                                text="Cancel"
                                ariaLabel="Cancel export"
                                onClick={handleClose}
                                className="px-6"
                            />
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ExportModal;