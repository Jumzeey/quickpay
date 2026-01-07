import { useAsyncFetch } from '@/hooks/useAsyncFetch';
import { getKyc } from '@/services/kyc';
import { KycStatus } from '@/types/kyc';
import { useRouter } from 'next/router';
import React from 'react';

const KYCBanner = () => {
    const router = useRouter();

    const { data: kycData } = useAsyncFetch({
        key: 'kyc-details',
        fn: async () => {
            const response = await getKyc();
            const data = response.data;

            // Handle new account structure: { data: { status: "Pending" } }
            if (data && typeof data === 'object' && !Array.isArray(data) && 'status' in data && !('fields' in data)) {
                return {
                    status: data.status,
                    fields: [],
                    created_at: null
                };
            }

            // Handle existing account structure: { data: [[{ fields: [...], status: ... }]] }
            return data?.[0]?.[0] || {};
        }
    });

    const kycStatus = kycData?.status as KycStatus | string;

    // Only show banner for Unverified, Pending, or Rejected status
    if (!kycStatus || (kycStatus !== KycStatus.UNVERIFIED && kycStatus !== KycStatus.PENDING && kycStatus !== KycStatus.REJECTED)) {
        return null;
    }

    const isUnverified = kycStatus === KycStatus.UNVERIFIED;
    const isPending = kycStatus === KycStatus.PENDING;
    const isRejected = kycStatus === KycStatus.REJECTED;

    // Yellow theme for Unverified, Orange theme for Pending, Red theme for Rejected
    const getThemeStyles = () => {
        if (isUnverified) {
            return {
                bg: 'bg-[#FEF3C7] dark:bg-[#78350F]',
                border: 'border-[#FCD34D] dark:border-[#F59E0B]',
                text: 'text-[#92400E] dark:text-[#FCD34D]',
                button: 'bg-[#F59E0B] hover:bg-[#D97706] text-white'
            };
        }
        if (isPending) {
            return {
                bg: 'bg-[#FFEDD5] dark:bg-[#7C2D12]',
                border: 'border-[#FDBA74] dark:border-[#FB923C]',
                text: 'text-[#9A3412] dark:text-[#FED7AA]',
                button: 'bg-[#FB923C] hover:bg-[#F97316] text-white'
            };
        }
        return {
            bg: 'bg-[#FEE2E2] dark:bg-[#7F1D1D]',
            border: 'border-[#FCA5A5] dark:border-[#EF4444]',
            text: 'text-[#991B1B] dark:text-[#FECACA]',
            button: 'bg-[#EF4444] hover:bg-[#DC2626] text-white'
        };
    };

    const theme = getThemeStyles();

    const handleAction = () => {
        router.push('/your-business?tab=business-kyc');
    };

    const getTitle = () => {
        if (isUnverified) return 'KYC Verification Required';
        if (isPending) return 'KYC Verification Pending';
        return 'KYC Verification Rejected';
    };

    const getMessage = () => {
        if (isUnverified) return "You haven't submitted your KYC verification yet. Please complete your KYC submission to continue using all features.";
        if (isPending) return "Your KYC verification is pending. We're reviewing your submission and will notify you once it's processed.";
        return "Your KYC verification was rejected. Please review and resubmit your KYC information.";
    };

    return (
        <div className={`w-[calc(100%+2.5rem)] md:w-[calc(100%+3.5rem)] border-t border-b ${theme.bg} ${theme.border} ${theme.text} py-4 mb-6 -mt-8 -ml-5 md:-ml-7`}>
            <div className="px-5 md:px-7">
                <div className={`flex flex-col ${!isPending ? 'sm:flex-row sm:items-center sm:justify-between' : ''} gap-3 sm:gap-4`}>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base">
                            {getTitle()}
                        </p>
                        <p className="text-xs sm:text-sm mt-1 opacity-90 break-words">
                            {getMessage()}
                        </p>
                    </div>
                    {!isPending && (
                        <button
                            onClick={handleAction}
                            className={`px-4 sm:px-6 py-2.5 rounded-md text-sm font-semibold transition-colors duration-200 whitespace-nowrap flex-shrink-0 w-full sm:w-auto ${theme.button}`}
                            aria-label="Go to KYC verification page"
                        >
                            Complete KYC
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KYCBanner;

