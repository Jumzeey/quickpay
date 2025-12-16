// import { VirtualAccountFormValues } from '@/components/collections/RequestVirtualAcount';
import {
  CollectionGatewayMetaResponse,
  CollectionHistoryResponse,
} from '@/components/collections/types';
import api, { virtualAccountApi } from '@/util/api';
import { apiEndpoints } from '@/util/endpoints';
import { notifyError } from '@/util/utils';

export interface PaymentLinkPayload {
  title: string;
  currency: string;
  amount: string;
  description: string;
  redirect_url?: string;
  account_type: string;
  subaccount_id?: string;
}

export interface VirtualAccountFormValues {
  reference: string;
  account_name: string;
  customer_email: string;
  type: string;
  virtual_account_type: string;
  bvn?: string;
  currency: string;
  provider?: string;
  first_name?: string;
  last_name?: string;
  other_name?: string;
  dob?: string;
  rc_number?: string;
  business_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  address?: string;
  id_number?: string;
  tax_id?: string;
  business_url?: string;
  beneficial_owner?: string;
  business_description?: string;
  government_id?: File | null;
  proof_of_address?: File | null;
  tax_identification?: File | null;
  source_of_funds?: File | null;
  certificate_of_incorporation?: File | null;
  tax_certificate?: File | null;
  proof_of_registered_address?: File | null;
  shareholder_register?: File | null;
  beneficial_owner_ids?: File | null;
  director_id?: File | null;
}

export async function getCollectionHistory(
  params?: object
): Promise<CollectionHistoryResponse | undefined> {
  try {
    const response = await api.get<CollectionHistoryResponse>(
      `${apiEndpoints.collections.GET_COLLECTION_HISTORY}`,
      { params }
    );
    return response.data as CollectionHistoryResponse;
  } catch (error: any) {
    notifyError(error.message);
  }
}

export async function getPaymentLinks(getTransactions: boolean, id?: number, params?: object) {
  const endpoint = getTransactions
    ? `${apiEndpoints.collections.GET_PAYMENT_LINKS}/${id}`
    : apiEndpoints.collections.GET_PAYMENT_LINKS;
  try {
    const response = await api.get(endpoint, params ? { params } : undefined);

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
  const { CREATE_PAYMENT_LINK, UPDATE_PAYMENT_LINK } = apiEndpoints.collections;

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
      `${apiEndpoints.collections.UPDATE_PAYMENT_LINK}/${id}/status`
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getVirtualAccounts(params?: object) {
  try {
    const response = await api.get(
      `${apiEndpoints.collections.GET_VIRTUAL_ACCOUNTS}`,
      {
        params,
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getVirtualAccountTransactions(id: string) {
  try {
    const response = await api.get(
      `${apiEndpoints.collections.GET_VIRTUAL_ACCOUNTS}/${id}`
    );
    return response.data.transactions;
  } catch (error) {
    throw error;
  }
}

// VirtualAccountFormValues
export async function createVirtualAccount(payload: FormData) {
  try {
    const response = await api.post(
      apiEndpoints.collections.REQUEST_VIRTUAL_ACCOUNT,
      payload,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      }
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function verifyVirtualAccountOtp({
  otp,
  customer_email,
}: {
  otp: string;
  customer_email: string;
}) {
  try {
    const response = await virtualAccountApi.post(
      apiEndpoints.collections.VERIFY_VIRTUAL_ACCOUNT_OTP,
      { otp, customer_email }
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function repushNotification(id: string | undefined) {
  try {
    const response = await api.get(
      `${apiEndpoints.collections.REPUSH_NOTIFICATION}/${id}/re-push`
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getPaymentMandates(params?: object) {
  try {
    const response = await api.get(
      apiEndpoints.collections.GET_PAYMENT_MANDATES,
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
      `${apiEndpoints.collections.REFRESH_STATUS}/${id}/status`
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function createPaymentMandate(payload: any) {
  try {
    const response = await api.post(
      apiEndpoints.collections.CREATE_PAYMENT_MANDATE,
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
      apiEndpoints.collections.REQUEST_REFUND,
      payload
    );
    return response;
  } catch (error: any) {
    notifyError(error.message);
  }
}

export async function getRefunds(params?: object) {
  try {
    const response = await api.get(`${apiEndpoints.collections.GET_REFUNDS}`, {
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
      `${apiEndpoints.collections.GET_SINGLE_REFUNDS}/${id}`
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

export const getCollectionGatewayMeta = async (
  id: string
): Promise<CollectionGatewayMetaResponse | undefined> => {
  try {
    const response = await api.get<CollectionGatewayMetaResponse>(
      `${apiEndpoints.collections.GET_COLLECTION_GATEWAY_META.replace(
        ':id',
        id
      )}`
    );
    return response.data;
  } catch (error: any) {
    notifyError(error.message || 'Failed to fetch gateway metadata');
    return undefined;
  }
};
