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

export async function getConversionHistory(params?: object) {
  try {
    const response = await api.get(
      `${apiEndpoints.conversions.GET_CONVERSION_HISTORY}`,
      { params }
    );
    return response.data;
  } catch (error: any) {
    notifyError(error.message);
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
