import api from "@/util/api";
import { apiEndpoints } from "@/util/endpoints";

interface NameCheckProps {
    bank_code: string;
    account_number: string;
}

export async function getBanks() {
  try {
    const response = await api.get(
      apiEndpoints.bank.GET_BANKS
    );
    return response.data.banks;
  } catch (error) {
    throw error;
  }
}

export async function performNameCheck(payload: NameCheckProps) {
  try {
    const response = await api.post(
      apiEndpoints.bank.NAME_CHECK, payload
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}