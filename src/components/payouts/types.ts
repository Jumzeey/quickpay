import { BankResponse } from "@/services/payout";

export interface TransferFormValues {
    currency?: string;
    bank: string;
    accountNumber: string;
    accountName: string;
    amount: string;
    walletId?: string;
    ref_id?: string;
    targetAccountName?: string;
    targetAccountNumber?: string;
}

export type TransferType = 'Same Currency Transfer' | 'Ramp Balance Transfer' | 'Cross Currency Transfer';

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
}
