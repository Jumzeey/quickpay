import { BankResponse } from "@/services/payout";

export interface TransferFormValues {
  currency?: string;
  channel?: "bank" | "momo" | "tron";
  bank: string;
  bank_code?: string; // For NGN at top level
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
  // New currency-based fields
  recipient_name?: string; // For NGN, KES, XOF
  countryCode?: string; // For ZMW, GHS
  // Sender info fields
  sender_name?: string;
  sender_phone?: string;
  sender_email?: string;
  // Recipient info fields (for receipient_info object)
  recipient_account_name?: string; // For GHS, KES, XOF
  recipient_bank_name?: string; // For KES
  recipient_bank_code?: string; // For GHS, KES
  otp?: string;
  initiateOtp?: string; // TOTP for initiate step when totp_enabled
}

export type TransferType =
  | "Same Currency Transfer"
  | "Cray Balance Transfer"
  | "Cross Currency Transfer"
  | "Mobile Money"
  | "Bulk Payout";

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
