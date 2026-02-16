import api from "@/util/api";
import { apiEndpoints } from "@/util/endpoints";

export interface InitiateCryptoPayload {
  customer_reference: string;
  amount: number;
}

export interface CryptoPaymentResponse {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    customer_reference: string;
    amount: string;
    currency: string;
    chain_type: string;
    payment_url: string;
    address: string;
    expires_in: number;
    provider_reference: string;
    date: string;
  };
}

export interface CryptoAddress {
  address: string;
  chain_type: string;
  currency: string;
  status: string;
  customer_reference: string;
  created_at: string;
  [key: string]: any;
}

export interface CryptoAddressesResponse {
  status: boolean;
  message: string;
  data: {
    addresses: CryptoAddress[];
    pagination: {
      count: number;
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
      next_page_url: string | null;
      previous_page_url: string | null;
    };
  };
}

export interface CryptoTransaction {
  reference: string;
  amount: string;
  currency: string;
  status: string;
  chain_type: string;
  date: string;
  [key: string]: any;
}

export interface CryptoTransactionsResponse {
  status: boolean;
  message: string;
  data: CryptoTransaction[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export async function initiateCryptoPayment(
  payload: InitiateCryptoPayload
): Promise<CryptoPaymentResponse> {
  try {
    const response = await api.post(
      apiEndpoints.crypto.INITIATE_CRYPTO_PAYMENT,
      payload
    );
    return response as unknown as CryptoPaymentResponse;
  } catch (error) {
    throw error;
  }
}

export async function getCryptoAddresses(
  params?: object
): Promise<CryptoAddressesResponse> {
  try {
    const response = await api.get(apiEndpoints.crypto.GET_CRYPTO_ADDRESSES, {
      params: { ...params, chain_type: "TRON" },
    });
    return response as unknown as CryptoAddressesResponse;
  } catch (error) {
    throw error;
  }
}

export async function getCryptoAddressTransactions(
  address: string,
  params?: object
): Promise<CryptoTransactionsResponse> {
  try {
    const response = await api.get(
      `${apiEndpoints.crypto.GET_CRYPTO_ADDRESS_TRANSACTIONS}/${address}/transactions`,
      { params: { ...params, chain_type: "TRON" } }
    );
    return response as unknown as CryptoTransactionsResponse;
  } catch (error) {
    throw error;
  }
}
