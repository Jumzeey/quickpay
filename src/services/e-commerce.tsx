import api from "@/util/api";
import { apiEndpoints } from "@/util/endpoints";

interface AddShippingPayload {
  region: string;
  amount: string;
}

export async function getShippingSettings() {
  try {
    const response = await api.get(
      `${apiEndpoints.ecommerce.GET_SHIPPING_SETTINGS}`
    );
    return response.data.shippings;
  } catch (error) {
    throw error;
  }
}

export async function addShippingFee(payload: AddShippingPayload) {
  try {
    const response = await api.post(
      `${apiEndpoints.ecommerce.ADD_SHIPPING_FEE}`,
      payload
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getShippingOrders() {
  try {
    const response = await api.get(
      `${apiEndpoints.ecommerce.GET_SHIPPING_ORDERS}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}
