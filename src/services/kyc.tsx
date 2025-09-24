import api from "@/util/api";
import { apiEndpoints } from "@/util/endpoints";

export async function getKycMethods() {
  try {
    const response = await api.get(apiEndpoints.kyc.GET_KYC_METHODS);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function createKyc(payload: any) {
  try {
    const response = await api.post(apiEndpoints.kyc.CREATE_KYC, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getKyc() {
  try {
    const response = await api.get(apiEndpoints.kyc.GET_KYC);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function uploadFile(payload: any) {
  try {
    const response = await api.post(apiEndpoints.utilities.UPLOAD_FILE, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  } catch (error) {
    throw error;
  }
}
