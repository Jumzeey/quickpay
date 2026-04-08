import env from "@/config/env";
import useNetworkLoaderStore from "@/stores/useNetworkLoaderStore";
import useKyc from "@/stores/useKyc";
import { KycStatus } from "@/types/kyc";
import { notifyError, FORBIDDEN_MESSAGE } from "@/util/utils";
import Axios from "axios";
import router from "next/router";
import { CustomHttpError } from "./errors/CustomHttpError";

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
    // Handle error responses (status === "error" | status === false | success === false)
    const isErrorResponse =
      response.data?.status === "error" ||
      response.data?.status === false ||
      response.data?.success === false;

    if (isErrorResponse) {
      if (
        response.data?.errors &&
        Object.keys(response.data.errors).length > 0
      ) {
        // Extract first error message from nested structure (e.g. { director_tin: ["Invalid format for Company TIN"] })
        const errors = response.data.errors;
        const firstError = Object.values(errors).flat().find((v) => typeof v === "string") as string | undefined;

        return Promise.reject(
          new CustomHttpError(
            firstError ||
              response.data?.message ||
              "Request validation failed!",
            {
              statusCode: 400,
              responseText:
                firstError ||
                response.data?.message ||
                "Request validation failed!",
              payload: response.data?.errors,
            }
          )
        );
      }

      return Promise.reject(
        new CustomHttpError(response.data?.message || "Request failed", {
          statusCode: 400,
          responseText: response.data?.message || "Request failed",
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
          "Error occurred while sending the request",
          {
            statusCode: 0,
            responseText:
              "Error occurred while sending the request",
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
      // Get KYC status to show appropriate message
      const { userKyc } = useKyc.getState();
      const kycStatus = userKyc?.status as KycStatus | string;

      let errorMessage =
        "Upgrade to KYC for registered businesses to access a virtual account.";

      if (kycStatus === KycStatus.PENDING) {
        errorMessage =
          "You can't access virtual account until your KYC is approved.";
      } else if (kycStatus === KycStatus.RE_SUBMITTED) {
        errorMessage =
          "You can't access virtual account until your KYC is approved. Please wait for review.";
      } else if (kycStatus === KycStatus.UNVERIFIED) {
        errorMessage = "You need to submit KYC to access virtual account.";
      } else if (kycStatus === KycStatus.REJECTED) {
        errorMessage = "You need to resubmit KYC to access virtual account.";
      }

      notifyError(errorMessage, "KYC Verification Required");
      router.push("/your-business?tab=business-kyc");
      return {
        success: false,
        message: errorMessage,
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

    // 403 with requires_totp: TOTP verification required for sensitive action (caller can show TOTP prompt)
    if (status === 403 && data?.requires_totp === true) {
      return Promise.reject(
        new CustomHttpError(data?.message || "TOTP verification required.", {
          statusCode: status,
          responseText: data?.message || "TOTP verification required.",
          payload: { requires_totp: true, ...data },
        })
      );
    }

    // 403 Forbidden: show a clear permission message (for both HTML and JSON responses).
    if (status === 403) {
      return Promise.reject(
        new CustomHttpError(FORBIDDEN_MESSAGE, {
          statusCode: status,
          responseText: FORBIDDEN_MESSAGE,
          payload: typeof data === "object" ? data : { raw: "forbidden" },
        })
      );
    }

    // Handle 404 errors: use server message when present
    if (status === 404) {
      const errorMessage =
        (typeof data?.message === "string" && data.message.trim()) ||
        "Failed, try again later.";
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

    // Handle 500+ errors: use server message when present
    if (status >= 500) {
      const errorMessage =
        (typeof data?.message === "string" && data.message.trim()) ||
        "Failed, try again later.";
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

    // Handle 422 (and 400) validation errors: show detailed messages from response.data.errors
    if ((status === 422 || status === 400) && data?.errors && typeof data.errors === "object") {
      const errors = data.errors;
      const messages = (Object.values(errors) as unknown[])
        .flat()
        .filter((v): v is string => typeof v === "string");
      const detail =
        messages.length > 0 ? messages.join(" ") : (data?.message || "Validation failed");
      return Promise.reject(
        new CustomHttpError(detail, {
          statusCode: status,
          responseText: detail,
          payload: errors,
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
