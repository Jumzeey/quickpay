import api from "@/util/api";
import { apiEndpoints } from "@/util/endpoints";

export interface SupportedCountry {
  id: string;
  product_type: string;
  currency: string;
  is_active: boolean;
}

export interface SupportedCountriesResponse {
  success: boolean;
  data: SupportedCountry[];
  meta: any;
}

export async function getSupportedCountries(): Promise<SupportedCountriesResponse> {
  try {
    const response = await api.get(apiEndpoints.utilities.SUPPORTED_COUNTRIES);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function signIn(payload: any) {
  try {
    const response = await api.post(apiEndpoints.auth.LOGIN,payload);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function verifyOtp(payload: any) {
  try {
    const response = await api.post(
       `${apiEndpoints.auth.VERIFY_OTP}/${payload.verify_reference}`,
       payload
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function forgotPassword(payload: any) {
  try {
    const response = await api.post(apiEndpoints.auth.FORGOT_PASSWORD,payload);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function forgotPasswordOtp(payload: any) {
  try {
    const response = await api.post(
      `${apiEndpoints.auth.FORGOT_PASSWORD_OTP}/${payload.verify_reference}`,
      payload
   );
   return response;
  } catch (error) {
    throw error;
  }
}

export async function newPassword(payload: any) {
  try {
    const response = await api.post(apiEndpoints.auth.RESET_PASSWORD,payload);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function resendOtp(verify_reference: any) {
  try {
    const response = await api.get(
      `${apiEndpoints.auth.RESEND_OTP}/${verify_reference}`
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function signUp(payload: any) {
  try {
    const response = await api.post(apiEndpoints.auth.REGISTER,payload);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function logout() {
  try {
    const response = await api.get(apiEndpoints.auth.LOGOUT);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function verifyEmail(token: any) {
  try {
    const response = await api.get(
      `${apiEndpoints.auth.VERIFY_EMAIL}/${token}`
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function get2faStatus() {
  try {
    const response = await api.get(apiEndpoints.security.GET_2FA_STATUS);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function setup2fa() {
  try {
    const response = await api.post(apiEndpoints.security.SETUP_2FA, {
      method: "totp",
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function confirm2fa(payload: { totp: string }) {
  try {
    const response = await api.post(apiEndpoints.security.CONFIRM_2FA, payload);
    return response;
  } catch (error) {
    throw error;
  }
}

export async function regenerateRecoveryCodes(payload: { totp: string }) {
  try {
    const response = await api.post(
      apiEndpoints.security.REGENERATE_RECOVERY_CODES,
      payload
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function disable2fa(payload: { totp: string }) {
  try {
    const response = await api.post(apiEndpoints.security.DISABLE_2FA, payload);
    return response;
  } catch (error) {
    throw error;
  }
}
