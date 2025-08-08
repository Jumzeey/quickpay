import Button from '@/components/button';
import Dropdown from '@/components/Dropdown';
import Icon from '@/components/icon';
import { useExportJob } from '@/hooks/useExportJob';
import React, { useState } from 'react';

const ExportPendingJobs: React.FC = () => {
    const { pendingJobs, resumeExport } = useExportJob();
    const [isOpen, setIsOpen] = useState(false);

    if (!pendingJobs || pendingJobs.length === 0) {
        return null;
    }

    const getExportTypeLabel = (type: string) => {
        switch (type) {
            case 'settlement-transactions':
                return 'Settlement Transactions';
            case 'wallet-history':
                return 'Wallet History';
            case 'payouts':
                return 'Payouts';
            case 'collections':
                return 'Collections';
            case 'activities':
                return 'Activity Log';
            default:
                return 'Export';
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Dropdown
            // isOpen={isOpen}
            // onOpen={() => setIsOpen(true)}
            onOpen={true}
            onClose={() => setIsOpen(false)}
            // trigger={
            //     <Button
            //         className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded"
            //         ariaLabel="View pending exports"
            //         text={
            //             <>
            //                 <Icon name="download" className="h-4 w-4" />
            //                 <span className="mr-1">Exports</span>
            //                 <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            //                     {pendingJobs.length}
            //                 </span>
            //             </>
            //         }
            //     />
            // }
        >
            <div className="w-72 bg-white shadow-lg rounded-md p-2">
                <div className="py-1 px-2">
                    <h3 className="text-sm font-medium text-gray-900">Pending Exports</h3>
                    <p className="text-xs text-gray-500">You can resume these exports</p>
                </div>

                <div className="mt-2 max-h-60 overflow-y-auto">
                    {pendingJobs.map((job) => (
                        <div
                            key={job.jobId}
                            className="px-2 py-2 hover:bg-gray-50 rounded flex items-center justify-between"
                        >
                            <div>
                                <p className="text-sm font-medium">{getExportTypeLabel(job.exportType)}</p>
                                <p className="text-xs text-gray-500">Started at {formatTime(job.timestamp)}</p>
                            </div>
                            <Button
                                className="text-primary text-xs"
                                ariaLabel={`Resume ${getExportTypeLabel(job.exportType)} export`}
                                text="Resume"
                                onClick={() => {
                                    resumeExport(job.jobId, job.statusEndpoint);
                                    setIsOpen(false);
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </Dropdown>
    );
};

export default ExportPendingJobs;