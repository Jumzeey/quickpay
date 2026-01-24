import { BankResponse } from "@/services/payout";

export interface TransferFormValues {
    currency?: string;
    channel?: 'bank' | 'momo';
    bank: string;
    network?: string;
    accountNumber: string;
    accountName: string;
    amount: string;
    walletId?: string;
    ref_id?: string;
    targetAccountName?: string;
    targetAccountNumber?: string;
    mobileProvider: string;
    phoneNumber: string;
    narration: string;
}

export type TransferType = 'Same Currency Transfer' | 'Cray Balance Transfer' | 'Cross Currency Transfer' | 'Mobile Money' | 'Bulk Payout';

export interface TransferOption {
    id: number;
    name: TransferType;
}

export interface TransferState {
    selectedOptionName: string;
    isLoading: boolean;
    isSubmitting: boolean;
    // 0: options, 1: form, 2: cross-currency details (if applicable), 3: OTP verification
    currentStep: number;
    banks: BankResponse[];
    payoutOptions: {
        supportsBank: boolean;
        supportsMomo: boolean;
        banks: any[];
        networks: any[];
    } | null;
}
