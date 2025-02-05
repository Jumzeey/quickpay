import api from "@/util/api";
import env from "@/config/env";
import { apiEndpoints } from "@/util/endpoints";

export async function getSubaccountHistory(params?: object) {
  try {
    const response = await api.get(
      `${apiEndpoints.subaccount.GET_SUBACCOUNT_HISTORY}`,
      {params}
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getSubaccountTransactions(id:any,params?: object) {
  try {
    const response = await api.get(
      `/merchant/subaccounts/${id}/transactions`,
      { params }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}


export async function postSubAccountAmount(payload: any) {
  try {
    const response = await api.post('/merchant/subaccounts/store', payload);
    return response;
  } catch (error) {
    throw error;
  }
}
export async function updateSubAccountAmount(payload: any) {
  try {
    const response = await api.put(`/merchant/subaccounts/${payload.id}/update`, payload);
    return response;
  } catch (error) {
    throw error;
  }
}
export async function changeModeToLive(payload: any) {
  try {
    const response = await api.put(`/merchant/subaccounts/${payload.id}/live`, payload);
    return response;
  } catch (error) {
    throw error;
  }
}
export async function deactivateSubAccount(payload: any) {
  try {
    const response = await api.delete(`/merchant/subaccounts/${payload.id}`, payload);
    return response;
  } catch (error) {
    throw error;
  }
}