import env from "@/config/env";
import useNetworkLoaderStore from "@/stores/useNetworkLoaderStore";
import Axios from "axios";
import router from "next/router";
import { CustomHttpError } from "./errors/CustomHttpError";
// Removed notifyError import to prevent duplicate toasts - hooks will handle it

const { baseUrl, altUrl, secretKey } = env;

const api = Axios.create({
  baseURL: baseUrl,
  withCredentials: false,
  headers: {
    Accept: "application/json",
    ...(process.env.NODE_ENV === "development" ? { "dev-mode": "true" } : {}),
  },
});
api.interceptors.request.use(
  function (config) {
    showLoadingBar();

    // Ensure Accept header is always set - force it to be set
    if (!config.headers) {
      config.headers = {} as any;
    }
    // Always set Accept header, even if it exists
    config.headers.Accept = "application/json";

    return config;
  },
  function (error) {
    hideLoadingBar();
    // Do something with request error
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  function (response) {
    hideLoadingBar();
    if (response.data?.status === "error") {
      if (
        response.data?.errors &&
        Object.values(response.data?.errors).length
      ) {
        const errors = Object.values(response.data?.errors);
        return Promise.reject(
          new CustomHttpError(errors[0], {
            statusCode: 400,
            responseText: errors[0],
            payload: response.data?.errors,
          })
        );
      }

      return Promise.reject(
        new CustomHttpError(response.data?.message, {
          statusCode: 400,
          responseText: response.data?.message,
        })
      );
    }
    return response.data;
  },
  function (err) {
    hideLoadingBar();
    if (!err.response) {
      return Promise.reject(
        new CustomHttpError(
          "Error occurred while sending the request, please check your internet settings",
          {
            statusCode: 0,
            responseText:
              "Error occurred while sending the request, please check your internet settings",
          }
        )
      );
    }

    const { status, data } = err.response;
    if (status === 401 && data?.data?.error_code === "kyc_01") {
      // Don't show toast here - let the hook handle it to avoid duplicates
      router.push("/your-business?tab=business-kyc");
      return {
        success: false,
        message: "Kyc not verified",
      };
    }

    if (status === 401 && data?.data?.error_code === "virtual_account_01") {
      // Don't show toast here - let the hook handle it to avoid duplicates
      router.push("/your-business?tab=business-kyc");
      return {
        success: false,
        message:
          "Upgrade to KYC for registered businesses to access a virtual account.",
      };
    }

    // if (status === 401 && data.data.error_code === "bank_01") {
    //   notifyError("Create a Settlement Account.");
    //   router.push("/your-business/settlement-accounts");
    //   return {
    //     success: false,
    //     message: "Create a Settlement Account",
    //   };
    // }

    // if (status === 403) {
    //   notifyError("User does not have the right permissions.");
    //   return {
    //     success: false,
    //     message: "User does not have the right permissions.",
    //   };
    // }

    // Handle 404 errors with generic message
    if (status === 404) {
      const errorMessage = "Failed, try again later.";
      return Promise.reject(
        new CustomHttpError(errorMessage, {
          statusCode: status,
          responseText: errorMessage,
          payload: {
            originalError: err.response.data,
            timestamp: new Date().toISOString(),
          },
        })
      );
    }

    // Handle 500+ errors with generic message
    if (status >= 500) {
      const errorMessage = "Failed, try again later.";
      // Don't show toast here - let the hook handle it to avoid duplicates
      return Promise.reject(
        new CustomHttpError(errorMessage, {
          statusCode: status,
          responseText: errorMessage,
          payload: {
            originalError: err.response.data,
            timestamp: new Date().toISOString(),
          },
        })
      );
    }

    if (err.response.data && err.response.data.message) {
      return Promise.reject(
        new CustomHttpError(err.response.data.message, {
          statusCode: err.response.status,
          responseText: err.response.data.message,
          payload: err.response.data.payload,
          responseCode: err.response.data.responseCode,
        })
      );
    }
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(
      new CustomHttpError("Error occurred while sending the request", {
        statusCode: err.response.status,
        responseText: "Error occurred while sending the request",
      })
    );
  }
);

function showLoadingBar() {
  useNetworkLoaderStore.getState().increaseLoadingCount();
}

function hideLoadingBar() {
  useNetworkLoaderStore.getState().decreaseLoadingCount();
}

export const virtualAccountApi = Axios.create({
  baseURL: altUrl,
  withCredentials: false,
  headers: {
    "api-key": secretKey,
  },
});

export default api;
