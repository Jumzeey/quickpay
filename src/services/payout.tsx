import { getBanks } from "@/services/bank";
import { CurrencyOption } from "@/stores/useCurrency";
import api from "@/util/api";
import { apiEndpoints } from "@/util/endpoints";

export interface PayoutHistoryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: 'pending' | 'successful' | 'failed' | 'processing';
  start_date?: string;
  end_date?: string;
  export?: boolean;
  currency?: CurrencyOption;
}

export interface InterbankPayoutPayload {
  amount: string;
  ref_id: string;
  bank_code: string;
  account_number: string;
  account_name: string;
}

export interface Payout {
  id: string;
  amount: number;
  processing_fee?: number;
  account_name: string;
  account_number: string;
  bank: string;
  bank_code?: string;
  reference: string;
  created_at: string;
  updated_at?: string;
  status: 'pending' | 'successful' | 'failed' | 'processing';
  balance_before?: number;
  current_balance?: number;
  balance_after?: number;
  narration?: string;
  currency?: string;
  transaction_type?: string;
}

export interface PayoutHistoryResponse {
  disbursements: Payout[];
  pagination: {
    count: number;
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
  export_link?: string;
}

export interface VerifyPayoutOtpPayload {
  otp: string;
}

export interface PayoutResponse {
  status: boolean;
  message: string;
  data?: any;
}

export interface BankResponse {
  institutionCode: string;
  institutionName: string;
  category: number;
  categoryCode: string;
}

export async function getPayoutHistory(params?: PayoutHistoryParams): Promise<PayoutHistoryResponse> {
  try {
    const response = await api.get(
      `${apiEndpoints.payouts.GET_PAYOUT_HISTORY}`,
      { params }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function addInterBankPayout(payload: InterbankPayoutPayload): Promise<PayoutResponse> {
  try {
    const response = await api.post(
      `${apiEndpoints.payouts.ADD_PAYOUT}`,
      payload
    );
    // @ts-ignore
    return response;
  } catch (error) {
    throw error;
  }
}

export async function verifyPayoutOtp(payload: VerifyPayoutOtpPayload): Promise<PayoutResponse> {
  try {
    const response = await api.post(
      `${apiEndpoints.payouts.VERIFY_PAYOUT_OTP}`,
      payload
    );
    // @ts-ignore
    return response;
  } catch (error) {
    throw error;
  }
}

export async function viewPayout(id: string): Promise<{ payout: Payout }> {
  try {
    const response = await api.get(
      `${apiEndpoints.payouts.GET_PAYOUT_HISTORY}/${id}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function validateBankAccount(bankCode: string, accountNumber: string): Promise<{ account_name: string }> {
  try {
    const response = await api.post(apiEndpoints.bank.NAME_CHECK, {
      bank_code: bankCode,
      account_number: accountNumber
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getBankList(): Promise<{ banks: Array<{ name: string; code: string; }> }> {
  try {
    const response = await getBanks();
    const banks = response || [];
    return {
      banks: banks.map((bank: BankResponse) => ({
        name: bank.institutionName,
        code: bank.institutionCode,
      }))
    };
  } catch (error) {
    throw error;
  }
}

export const addPayout = addInterBankPayout;
