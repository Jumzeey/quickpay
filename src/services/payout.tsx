import { getBanks } from "@/services/bank";
import { CurrencyOption } from "@/stores/useCurrency";
import { RaiseDisputePayload, RequestRefundPayload } from "@/stores/usePayout";
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
  id: number;
  reference: string;
  customer_reference: string;
  currency: string;
  currency_symbol: string;
  amount: string;
  processing_fee: string;
  session_id: string | null;
  net_amount: string;
  balance_before: string;
  current_balance: string;
  recipient_account_name: string;
  recipient_account_number: string;
  recipient_bank: string;
  status: string;
  created_at: string;
  value_date: string;
  extra_fields: null;
  channel: string;
  provider_status: string;
  failure_reason: string;
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

export interface PayoutOptionBank {
  bank_name: string;
  short_code: string;
  bank_code: string;
  institutionCode: string;
  institutionName: string;
}

export interface PayoutOptionNetwork {
  name: string;
}

export interface PayoutOptionChannel {
  name: string;
  supportsBank: boolean;
  supportsMomo: boolean;
  banks: PayoutOptionBank[];
  networks: PayoutOptionNetwork[];
}

export interface PayoutOptionsResponse {
  status?: boolean;
  message?: string;
  data: {
    payout_options: {
      currency: string;
      countryCode: string;
      channels: PayoutOptionChannel[];
    };
  };
}

export interface RequeryPayoutResponse {
  Transaction: {
    success: boolean;
    data: {
      reference: string;
      amount: string;
      charge: string;
      status: string;
      recipient_name: string;
      recipient_bank_code: string;
      recipient_account_number: string;
      processor_reference: string;
      merchant_reference: string;
    } | null;
    message: string;
  };
}

export async function requeryPayout(reference: string): Promise<RequeryPayoutResponse> {
  try {
    const response = await api.get(
      `${apiEndpoints.payouts.REQUERY_PAYOUT}/${reference}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
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

export async function getPayoutOptions(currency: string): Promise<PayoutOptionsResponse | null> {
  try {
    // API interceptor already returns response.data, so response here is the unwrapped data
    // which is { status, message, data: { payout_options: {...} } }
    const response: any = await api.get(
      apiEndpoints.utilities.GET_PAYOUT_OPTIONS,
      { params: { currency: currency.toLowerCase() } }
    );

    // Handle case where API returns status: false (no payout options available)
    if (response?.status === false) {
      // Return null to indicate no options are available (not an error)
      return null;
    }

    return response as PayoutOptionsResponse;
  } catch (error) {
    // If it's a CustomHttpError with the specific message, treat it as no options available
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message || '';
      if (errorMessage.includes('No available payout option') ||
        errorMessage.includes('Failed to retrieve payout options')) {
        return null;
      }
    }
    throw error;
  }
}

export async function requestRefund(payload: RequestRefundPayload): Promise<PayoutResponse> {
  try {
    const response = await api.post(
      `${apiEndpoints.payouts.REQUEST_REFUND}`,
      payload
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function raiseDispute(payload: RaiseDisputePayload): Promise<PayoutResponse> {
  try {
    const response = await api.post(
      `${apiEndpoints.payouts.RAISE_DISPUTE}`,
      payload
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export const addPayout = addInterBankPayout;

export interface BulkPayoutPayload {
  file: File;
  currency: string;
}

export interface BulkPayoutResponse {
  status: boolean;
  message: string;
  data?: any;
}

export async function initiateBulkPayout(payload: BulkPayoutPayload): Promise<BulkPayoutResponse> {
  try {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('currency', payload.currency);

    const response = await api.post(
      `${apiEndpoints.payouts.INITIATE_BULK_PAYOUT}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    // @ts-ignore
    return response;
  } catch (error) {
    throw error;
  }
}

export interface CompleteBulkPayoutPayload {
  otp: string;
}

export async function completeBulkPayout(payload: CompleteBulkPayoutPayload): Promise<BulkPayoutResponse> {
  try {
    const response = await api.post(
      `${apiEndpoints.payouts.COMPLETE_BULK_PAYOUT}`,
      payload
    );
    // @ts-ignore
    return response;
  } catch (error) {
    throw error;
  }
}
