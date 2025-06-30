export interface ConversionFormValues {
    bank: string;
    accountNumber: string;
    accountName: string;
    amount: string;
    walletId?: string;
    targetAccountName?: string;
    targetAccountNumber?: string;
}

export type ConversionType = 'Same Currency Conversion' | 'Ramp Balance Conversion' | 'Cross Currency Conversion';

export interface ConversionOption {
    id: number;
    name: ConversionType;
}

export interface ConversionState {
    selectedOptionName: ConversionType | '';
    isLoading: boolean;
    isSubmitting: boolean;
    currentStep: number;
}
