import {
  forgotPassword,
  forgotPasswordOtp,
  get2faStatus,
  getSupportedCountries,
  newPassword,
  resendOtp,
  signIn,
  signUp,
  verifyEmail,
  verifyOtp,
} from "@/services/authentication";
import api from "@/util/api";
import { getAllCurrencies } from "@/util/utils";
import Cookies from "js-cookie";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import useCurrency from "@/stores/useCurrency";
import { useModuleStore } from "@/stores/module-store";

const accessGet = globalThis.localStorage?.getItem("auth");
const accessGetParse = accessGet ? JSON?.parse(accessGet) : null;
const initialState = {
  accessToken: accessGetParse?.state?.accessToken || null,
  user: accessGetParse?.state?.user || null,
  modules: accessGetParse?.state?.modules || [],
  supportedCountries: accessGetParse?.state?.supportedCountries || [],
  supportedCountriesLoading: false,
  signInLoading: false,
  signUpLoading: false,
  resetPasswordOtpLoading: false,
  newPasswordLoading: false,
  forgotPasswordLoading: false,
  forgotPasswordOtpLoading: false,
  allowed_methods: accessGetParse?.state?.allowed_methods || [],
  totp_enabled: accessGetParse?.state?.totp_enabled ?? false,
};

api.defaults.headers.common.Authorization = `Bearer ${initialState.accessToken}`;

const useAuthentication = create(
  persist(
    (set, get) => ({
      ...initialState,
      setUser: (user) => set((state) => ({ ...state, user })),
      signUp: async (payload) => {
        set((state) => ({
          ...state,
          signUpLoading: true,
        }));
        const { data, message } = await signUp(payload);
        set((state) => ({
          ...state,
          verify_reference: data.verify_reference,
        }));
        return { verify_reference: data.verify_reference, message };
      },
      signIn: async (payload) => {
        set((state) => ({
          ...state,
          signInLoading: true,
        }));
        const response = await signIn(payload);
        const { data, message } = response;
        // When OTP/TOTP is required, API returns verify_reference + allowed_methods (no token)
        // Persist allowed_methods so we know 2FA method (totp vs email_otp) and derive totp_enabled for sensitive actions
        if (data?.verify_reference && !data?.token) {
          const methods = data.allowed_methods || ["email_otp"];
          const hasTotp = methods.includes("totp");
          set((state) => ({
            ...state,
            verify_reference: data.verify_reference,
            allowed_methods: methods,
            totp_enabled: hasTotp,
            signInLoading: false,
          }));
          return {
            verify_reference: data.verify_reference,
            allowed_methods: methods,
            message,
          };
        }
        const modules = data?.modules ?? [];
        useModuleStore.getState().setModules(modules);
        const allCurrencies = getAllCurrencies(modules);
        const firstCurrency = allCurrencies?.[0];
        if (firstCurrency?.value) {
          useCurrency.getState().setCurrency(firstCurrency.value);
          useCurrency.getState().setDefaultCurrency(firstCurrency.value);
        }
        set((state) => ({
          ...state,
          user: data.user,
          modules,
          accessToken: data.token,
          verify_reference: data.verify_reference,
          allowed_methods: [],
          signInLoading: false,
        }));
        return { verify_reference: data.verify_reference, message };
      },
      formatSupportedCountries: (countriesData) => {
        // Get unique currencies and create country-like objects
        const uniqueCurrencies = [
          ...new Set(countriesData.map((item) => item.currency)),
        ];

        // Currency to country mapping (you can expand this)
        const currencyToCountry = {
          USD: { code: "US", name: "United States", flag: "🇺🇸" },
          NGN: { code: "NG", name: "Nigeria", flag: "🇳🇬" },
          KES: { code: "KE", name: "Kenya", flag: "🇰🇪" },
          GHS: { code: "GH", name: "Ghana", flag: "🇬🇭" },
          TZS: { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
          ZMW: { code: "ZM", name: "Zambia", flag: "🇿🇲" },
          EUR: { code: "EU", name: "European Union", flag: "🇪🇺" },
          GBP: { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
        };

        return uniqueCurrencies
          .filter((currency) => currencyToCountry[currency]) // Only include currencies we have country data for
          .map((currency) => {
            const countryInfo = currencyToCountry[currency];
            const supportedProducts = countriesData
              .filter((item) => item.currency === currency && item.is_active)
              .map((item) => item.product_type);

            return {
              id: countryInfo.code,
              code: countryInfo.code,
              name: countryInfo.name,
              currency: currency,
              flag: countryInfo.flag,
              supportedProducts: supportedProducts,
              isActive: supportedProducts.length > 0,
              // For form compatibility
              value: countryInfo.code,
              label: `${countryInfo.flag} ${countryInfo.name} (${currency})`,
            };
          });
      },

      getSupportedCountries: async () => {
        set((state) => ({
          ...state,
          supportedCountriesLoading: true,
        }));

        try {
          const response = await getSupportedCountries();
          console.log({ response });
          const formattedCountries = get().formatSupportedCountries(response);

          set((state) => ({
            ...state,
            supportedCountries: formattedCountries,
            supportedCountriesLoading: false,
          }));

          return {
            countries: formattedCountries,
            rawData: response.data,
            message: "Countries loaded successfully",
          };
        } catch (error) {
          set((state) => ({
            ...state,
            supportedCountriesLoading: false,
          }));
          throw error;
        }
      },

      // Get countries by supported product type
      getCountriesByProduct: (productType) => {
        const supportedCountries = get().supportedCountries;
        return supportedCountries.filter((country) =>
          country.supportedProducts.includes(productType)
        );
      },

      // Get available currencies
      getAvailableCurrencies: () => {
        const supportedCountries = get().supportedCountries;
        return supportedCountries
          .filter((country) => country.isActive)
          .map((country) => ({
            code: country.currency,
            name: country.name,
            country: country.code,
            label: `${country.currency} - ${country.name}`,
          }));
      },
      verifyOtp: async (payload) => {
        set((state) => ({
          ...state,
        }));
        const { data, message } = await verifyOtp(payload);
        Cookies.set("accessToken", data.token);

        const modules = data?.modules ?? [];
        useModuleStore.getState().setModules(modules);
        const allCurrencies = getAllCurrencies(modules);
        const firstCurrency = allCurrencies?.[0];
        if (firstCurrency?.value) {
          useCurrency.getState().setCurrency(firstCurrency.value);
          useCurrency.getState().setDefaultCurrency(firstCurrency.value);
        }

        set((state) => ({
          ...state,
          user: data.user,
          modules,
          accessToken: data.token,
        }));
        return {
          user: data.user,
          modules,
          accessToken: data.token,
          message,
        };
      },
      verifyEmail: async (payload) => {
        set((state) => ({
          ...state,
        }));
        const { data, message } = await verifyEmail(payload);
        return {
          message,
        };
      },
      forgotPassword: async (payload) => {
        set((state) => ({
          ...state,
          forgotPasswordLoading: true,
        }));
        try {
          const { data, message } = await forgotPassword(payload);
          const methods = data?.allowed_methods;
          const next =
            Array.isArray(methods) && methods.length > 0
              ? {
                  allowed_methods: methods,
                  totp_enabled: methods.includes("totp"),
                }
              : {};
          set((state) => ({
            ...state,
            verify_reference: data.verify_reference,
            ...next,
          }));
          return { verify_reference: data.verify_reference, message };
        } finally {
          set((state) => ({
            ...state,
            forgotPasswordLoading: false,
          }));
        }
      },
      forgotPasswordOtp: async (payload) => {
        set((state) => ({
          ...state,
          forgotPasswordOtpLoading: true,
        }));
        try {
          const result = await forgotPasswordOtp(payload);
          const message = result?.message ?? "Password updated successfully.";
          return { message };
        } finally {
          set((state) => ({
            ...state,
            forgotPasswordOtpLoading: false,
          }));
        }
      },
      newPassword: async (payload) => {
        set((state) => ({
          ...state,
          newPasswordLoading: true,
        }));
        const { data, message } = await newPassword(payload);
        set((state) => ({
          ...state,
          data,
        }));
        return { message };
      },
      resendOtp: async (payload) => {
        set((state) => ({
          ...state,
        }));
        const { data, message } = await resendOtp(payload);
        const modules = data?.modules ?? [];
        useModuleStore.getState().setModules(modules);
        const allCurrencies = getAllCurrencies(modules);
        const firstCurrency = allCurrencies?.[0];
        if (firstCurrency?.value) {
          useCurrency.getState().setCurrency(firstCurrency.value);
          useCurrency.getState().setDefaultCurrency(firstCurrency.value);
        }
        set((state) => ({
          ...state,
          user: data.user,
          modules,
          accessToken: data.token,
          verify_reference: data.verify_reference,
        }));
        return {
          verify_reference: data.verify_reference,
          user: data.user,
          modules,
          accessToken: data.token,
          message,
        };
      },
    }),
    {
      name: "auth",
      whitelist: [
        "user",
        "accessToken",
        "modules",
        "supportedCountries",
        "totp_enabled",
        "allowed_methods",
      ],
    }
  )
);

useAuthentication.subscribe((state) => {
  api.defaults.headers.common.Authorization = `Bearer ${state.accessToken}`;
});

export default useAuthentication;
