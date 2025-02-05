import api from "@/util/api";
import { apiEndpoints } from "@/util/endpoints";

export async function getBankDetails() {
  try {
    const response = await api.get(apiEndpoints.user.GET_BANK_DETAILS);
    return response.data;
  } catch (error: any) {
    throw error;
  }
}