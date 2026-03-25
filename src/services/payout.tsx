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
  otp?: string;
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

export interface BulkPayoutHistoryItem {
  id: number;
  external_bulk_payout_id: string | null;
  merchant_id: number;
  currency: string;
  file_path: string;
  status: string;
  /** Present on newer bulk payout API responses */
  lien_status?: string | null;
  liens_placed_at?: string | null;
  verification_completed_at?: string | null;
  success_count: number;
  failure_count: number;
  total_amount: string;
  total_charge?: string | null;
  total_lien_amount?: string | null;
  failed_rows: unknown;
  successful_rows: unknown;
  reason: string | null;
  created_at: string;
  updated_at: string;
  total_transaction: number;
}

export interface BulkPayoutHistoryResponse {
  bulk_payouts: BulkPayoutHistoryItem[];
  pagination: {
    count: number;
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    previous_page_url: string | null;
  };
}

export interface BulkPayoutTransaction {
  id: number;
  bulk_payout_id: number;
  merchant_id: string;
  currency: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  amount: string;
  status: string;
  reference: string;
  customer_reference: string | null;
  bulk_payout_reference: string | null;
  failure_reason: string | null;
  raw_response: unknown;
  created_at: string;
  updated_at: string;
  /** Present on newer bulk payout transactions API responses */
  estimated_charge?: string | null;
  lien_amount?: string | null;
  mifos_transaction_id?: string | null;
  lien_placed_at?: string | null;
  verified_at?: string | null;
  transaction?: {
    id: number;
    customer_reference?: string | null;
    reference?: string;
    /** Backwards compat: older payloads used `channel` */
    channel?: string;
    /** Newer payloads use `payment_type` for the same idea */
    payment_type?: string;
    available_balance_before?: string;
    available_balance_after?: string;
    amount?: string;
    charge?: string;
    status?: string;
    created_at?: string;
  } | null;
}

export interface BulkPayoutTransactionsResponse {
  transactions: BulkPayoutTransaction[];
  pagination: {
    count: number;
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    previous_page_url: string | null;
  };
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

const defaultBulkPagination = {
  count: 0,
  total: 0,
  per_page: 20,
  current_page: 1,
  last_page: 1,
  next_page_url: null as string | null,
  previous_page_url: null as string | null,
};

function unwrapBulkHistoryPayload(raw: unknown): BulkPayoutHistoryResponse {
  const r = raw as Record<string, unknown> | null | undefined;
  if (!r || typeof r !== "object") {
    return { bulk_payouts: [], pagination: { ...defaultBulkPagination } };
  }
  const inner =
    Array.isArray(r.bulk_payouts) || (r.pagination && typeof r.pagination === "object")
      ? r
      : (r.data as Record<string, unknown> | undefined);
  const bulk_payouts = (inner?.bulk_payouts as BulkPayoutHistoryItem[]) ?? [];
  const pagination = (inner?.pagination as BulkPayoutHistoryResponse["pagination"]) ?? {
    ...defaultBulkPagination,
  };
  return { bulk_payouts, pagination };
}

export async function getBulkPayoutHistory(params?: {
  page?: number;
  per_page?: number;
  currency?: string;
}): Promise<BulkPayoutHistoryResponse> {
  try {
    const response = await api.get(
      apiEndpoints.payouts.INITIATE_BULK_PAYOUT,
      { params }
    );
    const body = (response as { data?: unknown })?.data ?? response;
    return unwrapBulkHistoryPayload(body);
  } catch (error) {
    throw error;
  }
}

function unwrapBulkTransactionsPayload(raw: unknown): BulkPayoutTransactionsResponse {
  const r = raw as Record<string, unknown> | null | undefined;
  if (!r || typeof r !== "object") {
    return {
      transactions: [],
      pagination: { ...defaultBulkPagination },
    };
  }
  const inner =
    Array.isArray(r.transactions) || (r.pagination && typeof r.pagination === "object")
      ? r
      : (r.data as Record<string, unknown> | undefined);
  const transactions = (inner?.transactions as BulkPayoutTransaction[]) ?? [];
  const pagination = (inner?.pagination as BulkPayoutTransactionsResponse["pagination"]) ?? {
    ...defaultBulkPagination,
  };
  return { transactions, pagination };
}

export async function getBulkPayoutTransactions(
  bulkPayoutId: number,
  params?: { page?: number; per_page?: number; currency?: string }
): Promise<BulkPayoutTransactionsResponse> {
  try {
    const response = await api.get(
      apiEndpoints.payouts.GET_BULK_PAYOUT_TRANSACTIONS.replace(":id", String(bulkPayoutId)),
      { params }
    );
    const body = (response as { data?: unknown })?.data ?? response;
    return unwrapBulkTransactionsPayload(body);
  } catch (error) {
    throw error;
  }
}

export async function addInterBankPayout(payload: InterbankPayoutPayload, isUsdtPayout: boolean = false): Promise<PayoutResponse> {
  try {
    const response = await api.post(
      `${isUsdtPayout ? apiEndpoints.payouts.ADD_USDT_PAYOUT : apiEndpoints.payouts.ADD_PAYOUT}`,
      payload
    );
    // @ts-ignore
    return response;
  } catch (error) {
    throw error;
  }
}

export async function verifyPayoutOtp(payload: VerifyPayoutOtpPayload, isUsdtPayout: boolean = false): Promise<PayoutResponse> {
  try {
    const response = await api.post(
      `${isUsdtPayout ? apiEndpoints.payouts.VERIFY_USDT_PAYOUT_OTP : apiEndpoints.payouts.VERIFY_PAYOUT_OTP}`,
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

/**
 * Key = column header from the uploaded file (e.g. act_num, bank_name).
 * Value = backend expected field name (e.g. account_number, bank_name).
 * Sent as mapping_headers[<key>] = value in form-data.
 * Either file (multipart) or file_url (S3 URL after client upload) must be provided.
 */
export interface BulkPayoutPayload {
  file?: File;
  file_url?: string;
  currency: string;
  mapping_headers: Record<string, string>;
  otp?: string;
}

export interface BulkPayoutResponse {
  status: boolean;
  message: string;
  data?: any;
}

export async function initiateBulkPayout(payload: BulkPayoutPayload): Promise<BulkPayoutResponse> {
  try {
    const formData = new FormData();
    if (payload.file) {
      formData.append('file', payload.file);
    }
    if (payload.file_url) {
      formData.append('file_url', payload.file_url);
    }
    formData.append('currency', payload.currency);
    Object.entries(payload.mapping_headers).forEach(([key, value]) => {
      formData.append(`mapping_headers[${key}]`, value);
    });
    if (payload.otp) {
      formData.append('otp', payload.otp);
    }

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

export async function getBulkPayoutStatus(bulk_payout_id: number): Promise<BulkPayoutResponse> {
  try {
    const response = await api.get(
      `${apiEndpoints.payouts.GET_BULK_PAYOUT_STATUS}/${bulk_payout_id}`
    );
    // @ts-ignore
    return response;
  } catch (error) {
    throw error;
  }
}

export interface CompleteBulkPayoutPayload {
  bulk_payout_id: number;
  otp: string;
}

export async function completeBulkPayout(payload: CompleteBulkPayoutPayload): Promise<BulkPayoutResponse> {
  try {
    const response = await api.post(
      `${apiEndpoints.payouts.COMPLETE_BULK_PAYOUT}/${payload.bulk_payout_id}`,
      { otp: payload.otp }
    );
    // @ts-ignore
    return response;
  } catch (error) {
    throw error;
  }
}

/** Cancel an initiated bulk payout (e.g. user leaves the OTP step). PATCH /merchant/disbursements/interbank/bulk/:id */
export async function cancelBulkPayout(bulk_payout_id: number): Promise<BulkPayoutResponse> {
  try {
    const response = await api.patch(
      `${apiEndpoints.payouts.GET_BULK_PAYOUT_STATUS}/${bulk_payout_id}`
    );
    // @ts-ignore
    return response;
  } catch (error) {
    throw error;
  }
}
