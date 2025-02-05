import api from "@/util/api";
import { apiEndpoints } from "@/util/endpoints";

export async function getDisbursementHistory(params?: object) {
  try {
    const response = await api.get(
      `${apiEndpoints.disbursements.GET_DISBURSEMENT_HISTORY}`,
      { params }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function addDisbursement(payload: any) {
  try {
    const response = await api.post(
      `${apiEndpoints.disbursements.ADD_DISBURSEMENT}`,
      payload
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function verifyDisbursementOtp(payload: any) {
  try {
    const response = await api.post(
      `${apiEndpoints.disbursements.VERIFY_DISBURSEMENT_OTP}`,
      payload
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function viewDisbursement(id: any) {
  try {
    const response = await api.get(
      `${apiEndpoints.disbursements.GET_DISBURSEMENT_HISTORY}/${id}`
    );
    return response;
  } catch (error) {
    throw error;
  }
}
