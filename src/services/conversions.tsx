import api from '@/util/api';
import { apiEndpoints } from '@/util/endpoints';
import { notifyError } from '@/util/utils';

export interface PaymentLinkPayload {
  title: string;
  amount: string;
  description: string;
  redirect_url?: string;
  account_type: string;
  subaccount_id?: string;
}

export async function addConversion(payload: any) {
  try {
    const response = await api.post(
      apiEndpoints.conversions.GET_CONVERSION_HISTORY,
      payload
    );
    return response;
  } catch (error: any) {
    notifyError(error.message);
    throw error;
  }
}

export async function verifyConversionOtp(payload: any) {
  try {
    const response = await api.post(
      `${apiEndpoints.conversions.GET_CONVERSION_HISTORY}/verify`,
      payload
    );
    return response;
  } catch (error: any) {
    notifyError(error.message);
    throw error;
  }
}

export async function viewConversion(id: string) {
  try {
    const response = await api.get(
      `${apiEndpoints.conversions.GET_CONVERSION_HISTORY}/${id}`
    );
    return response.data;
  } catch (error: any) {
    notifyError(error.message);
    throw error;
  }
}

export async function getConversionHistory(params?: object) {
  try {
    const response = await api.get(
      `${apiEndpoints.conversions.GET_CONVERSION_HISTORY}`,
      { params }
    );
    // Handle new API response structure: { status, message, data: { conversions, pagination } }
    if (response.data?.status && response.data?.data) {
      return {
        conversions: response.data.data.conversions || [],
        pagination: response.data.data.pagination || {},
      };
    }
    // Fallback for old structure
    return response.data || { conversions: [], pagination: {} };
  } catch (error: any) {
    notifyError(error.message);
    return { conversions: [], pagination: {} };
  }
}

export interface InitiateConversionPayload {
  quote_id: string;
}

export interface InitiateConversionResponse {
  success: boolean;
  data: {
    quote_id: string;
    debit_transaction_id: number;
    credit_transaction_id: number;
    settlement: string;
    sla_minutes: number;
  };
  message: string;
}

export async function initiateConversion(payload: InitiateConversionPayload): Promise<InitiateConversionResponse> {
  try {
    const response = await api.post(
      apiEndpoints.conversions.INITIATE_CONVERSION,
      payload
    ) as unknown as InitiateConversionResponse;
    return response;
  } catch (error: any) {
    notifyError(error.message || 'Failed to initiate conversion');
    throw error;
  }
}

export interface GetQuotePayload {
  source_currency: string;
  destination_currency: string;
  source_amount: number;
}

export interface GetQuoteResponse {
  success: boolean;
  data: {
    quote_id: string;
    conversion_rate: number;
    expires_in_minutes: number;
  };
  message: string;
}

export async function getQuote(payload: GetQuotePayload): Promise<GetQuoteResponse> {
  try {
    const response = await api.post(
      apiEndpoints.conversions.GET_QUOTE,
      payload
    ) as unknown as GetQuoteResponse;
    return response;
  } catch (error: any) {
    notifyError(error.message || 'Failed to generate quote');
    throw error;
  }
}

export async function getConversionRate(sourceCurrency: string, destinationCurrency: string) {
  try {
    const response = await api.post(
      apiEndpoints.conversions.GET_RATES,
      {
        source_currency: sourceCurrency,
        destination_currency: destinationCurrency,
      }
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

export async function getPaymentLinks(getTransactions: boolean, id?: number) {
  const endpoint = getTransactions
    ? `${apiEndpoints.conversions.GET_PAYMENT_LINKS}/${id}`
    : apiEndpoints.conversions.GET_PAYMENT_LINKS;
  try {
    const response = await api.get(endpoint);

    const res = id ? response.data.payment_link_transactions : response.data;
    return res;
  } catch (error) {
    throw error;
  }
}

export async function addPaymentLink(
  payload: PaymentLinkPayload,
  willUpdate: boolean,
  id: number
) {
  const { CREATE_PAYMENT_LINK, UPDATE_PAYMENT_LINK } = apiEndpoints.conversions;

  const endpoint = willUpdate
    ? api.put(`${UPDATE_PAYMENT_LINK}/${id}`, payload)
    : api.post(CREATE_PAYMENT_LINK, payload);

  try {
    const response = await endpoint;
    return response;
  } catch (error) {
    throw error;
  }
}

export async function disablePaymentLink(id: string) {
  try {
    const response = await api.get(
      `${apiEndpoints.conversions.UPDATE_PAYMENT_LINK}/${id}/status`
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getVirtualAccounts(params?: object) {
  try {
    const response = await api.get(
      `${apiEndpoints.conversions.GET_VIRTUAL_ACCOUNTS}`,
      { params }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getVirtualAccountTransactions(
  id: string | string[] | undefined
) {
  try {
    const response = await api.get(
      `${apiEndpoints.conversions.GET_VIRTUAL_ACCOUNTS}/${id}`
    );
    return response.data.transactions;
  } catch (error) {
    throw error;
  }
}

export async function createVirtualAccount(payload: any) {
  try {
    const response = await api.post(
      apiEndpoints.conversions.REQUEST_VIRTUAL_ACCOUNT,
      payload
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function repushNotification(id: string | undefined) {
  try {
    const response = await api.get(
      `${apiEndpoints.conversions.REPUSH_NOTIFICATION}/${id}/re-push`
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getPaymentMandates(params?: object) {
  try {
    const response = await api.get(
      apiEndpoints.conversions.GET_PAYMENT_MANDATES,
      { params }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function refreshStatus(id: string) {
  try {
    const response = await api.get(
      `${apiEndpoints.conversions.REFRESH_STATUS}/${id}/status`
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function createPaymentMandate(payload: any) {
  try {
    const response = await api.post(
      apiEndpoints.conversions.CREATE_PAYMENT_MANDATE,
      payload
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function requestRefund(payload: any) {
  try {
    const response = await api.post(
      apiEndpoints.conversions.REQUEST_REFUND,
      payload
    );
    return response;
  } catch (error: any) {
    notifyError(error.message);
  }
}

export async function getRefunds(params?: object) {
  try {
    const response = await api.get(`${apiEndpoints.conversions.GET_REFUNDS}`, {
      params,
    });
    return response.data;
  } catch (error: any) {
    notifyError(error.message);
  }
}

export async function getSingleRefund(id: string) {
  try {
    const response = await api.get(
      `${apiEndpoints.conversions.GET_SINGLE_REFUNDS}/${id}`
    );
    return response.data;
  } catch (error: any) {
    if (error.response.status === 404) {
      return null;
    } else {
      notifyError(error.message);
    }
  }
}
