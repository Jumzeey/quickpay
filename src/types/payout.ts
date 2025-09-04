// Enhanced types for the payout system
export interface PayoutFormData {
    amount: string;
    bank_code: string;
    account_number: string;
    account_name?: string; // Auto-filled after validation
    ref_id?: string;
}

export interface Payout {
    id: string;
    reference: string;
    amount: number;
    account_name: string;
    account_number: string;
    bank: string;
    status: 'pending' | 'successful' | 'failed' | 'processing';
    created_at: string;
    processing_fee?: number;
    balance_before?: number;
    balance_after?: number;
    current_balance?: number;
    narration?: string;
    transaction_type?: string;
}

export interface OtpVerificationFormData {
    otp: string;
}

export interface PayoutFiltersFormData {
    search: string;
    status: '' | 'pending' | 'successful' | 'failed' | 'processing';
    startDate: string;
    endDate: string;
}

export interface Bank {
    institutionCode: string;
    institutionName: string;
    category: number;
    categoryCode: string;
}

export interface PayoutStatus {
    id: string;
    status: 'pending' | 'successful' | 'failed' | 'processing';
    amount: number;
    account_name: string;
    bank: string;
    reference: string;
    created_at: string;
    processing_fee?: number;
    balance_before?: number;
    balance_after?: number;
    current_balance?: number;
    narration?: string;
    transaction_type?: string;
}

export interface PayoutActionProps {
    onInitiate: (data: PayoutFormData) => Promise<void>;
    onVerifyOtp: (data: OtpVerificationFormData) => Promise<void>;
    loading?: boolean;
    error?: string | null;
}

export interface PayoutModalState {
    isInitiateModalOpen: boolean;
    isOtpModalOpen: boolean;
    isDetailsModalOpen: boolean;
    selectedPayoutId: string | null;
    pendingReference: string | null;
}

export const PAYOUT_STATUSES = {
    PENDING: 'pending' as const,
    SUCCESSFUL: 'successful' as const,
    FAILED: 'failed' as const,
    PROCESSING: 'processing' as const,
};

export const PAYOUT_STATUS_COLORS = {
    [PAYOUT_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800',
    [PAYOUT_STATUSES.SUCCESSFUL]: 'bg-green-100 text-green-800',
    [PAYOUT_STATUSES.FAILED]: 'bg-red-100 text-red-800',
    [PAYOUT_STATUSES.PROCESSING]: 'bg-blue-100 text-blue-800',
};

export const PAYOUT_STATUS_LABELS = {
    [PAYOUT_STATUSES.PENDING]: 'Pending',
    [PAYOUT_STATUSES.SUCCESSFUL]: 'Successful',
    [PAYOUT_STATUSES.FAILED]: 'Failed',
    [PAYOUT_STATUSES.PROCESSING]: 'Processing',
};

// Validation schemas
export const VALIDATION_MESSAGES = {
    REQUIRED: 'This field is required',
    INVALID_AMOUNT: 'Please enter a valid amount',
    MIN_AMOUNT: 'Minimum amount is ₦100',
    MAX_AMOUNT: 'Maximum amount is ₦5,000,000',
    INVALID_ACCOUNT: 'Please enter a valid account number',
    INVALID_OTP: 'Please enter a valid 6-digit OTP',
    INVALID_DATE: 'Please select a valid date',
} as const;
