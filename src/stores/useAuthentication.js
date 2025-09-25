import { forgotPassword, forgotPasswordOtp, getSupportedCountries, newPassword, resendOtp, signIn, signUp, verifyEmail, verifyOtp } from "@/services/authentication";
import api from "@/util/api";
import { getAllCurrencies } from "@/util/utils";
import Cookies from "js-cookie";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const accessGet = globalThis.localStorage?.getItem('auth');
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
        const { data, message } = await signIn(payload);
        set((state) => ({
          ...state,
          user: data.user,
          accessToken: data.token,
          verify_reference: data.verify_reference,
          signInLoading: false,
        }));
        return { verify_reference: data.verify_reference, message };
      },
      formatSupportedCountries: (countriesData) => {
        // Get unique currencies and create country-like objects
        const uniqueCurrencies = [...new Set(countriesData.map(item => item.currency))];

        // Currency to country mapping (you can expand this)
        const currencyToCountry = {
          'USD': { code: 'US', name: 'United States', flag: '🇺🇸' },
          'NGN': { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
          'KES': { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
          'GHS': { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
          'TZS': { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
          'EUR': { code: 'EU', name: 'European Union', flag: '🇪🇺' },
          'GBP': { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
        };

        return uniqueCurrencies
          .filter(currency => currencyToCountry[currency]) // Only include currencies we have country data for
          .map(currency => {
            const countryInfo = currencyToCountry[currency];
            const supportedProducts = countriesData
              .filter(item => item.currency === currency && item.is_active)
              .map(item => item.product_type);

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
              label: `${countryInfo.flag} ${countryInfo.name} (${currency})`
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
            message: 'Countries loaded successfully'
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
        return supportedCountries.filter(country =>
          country.supportedProducts.includes(productType)
        );
      },

      // Get available currencies
      getAvailableCurrencies: () => {
        const supportedCountries = get().supportedCountries;
        return supportedCountries
          .filter(country => country.isActive)
          .map(country => ({
            code: country.currency,
            name: country.name,
            country: country.code,
            label: `${country.currency} - ${country.name}`
          }));
      },
      verifyOtp: async (payload) => {
        set((state) => ({
          ...state,
        }));
        const { data, message } = await verifyOtp(payload);
        Cookies.set('accessToken', data.token);

        const allCurrencies = getAllCurrencies(data.modules);
        if (allCurrencies.length > 0) {
          import("@/stores/useCurrency").then(({ default: useCurrency }) => {
            useCurrency.getState().setCurrency(allCurrencies[0].value);
            useCurrency.getState().setDefaultCurrency(allCurrencies[0].value);
          });
        }

        set((state) => ({
          ...state,
          user: data.user,
          modules: data.modules,
          accessToken: data.token,
        }));
        return {
          user: data.user,
          modules: data.modules,
          accessToken: data.token,
          message
        };
      },
      verifyEmail: async (payload) => {
        set((state) => ({
          ...state,
        }));
        const { data, message } = await verifyEmail(payload);
        return {
          message
        };
      },
      forgotPassword: async (payload) => {
        set((state) => ({
          ...state,
          forgotPasswordLoading: true,
        }));
        const { data, message } = await forgotPassword(payload);
        set((state) => ({
          ...state,
          verify_reference: data.verify_reference,
        }));
        return { verify_reference: data.verify_reference, message };
      },
      forgotPasswordOtp: async (payload) => {
        set((state) => ({
          ...state,
          forgotPasswordOtpLoading: true,
        }));
        const { message } = await forgotPasswordOtp(payload);
        set((state) => ({
          ...state,
        }));
        return { message };
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
        set((state) => ({
          ...state,
          user: data.user,
          accessToken: data.token,
          verify_reference: data.verify_reference,
        }));
        return {
          verify_reference: data.verify_reference,
          user: data.user,
          modules: data.modules,
          accessToken: data.token,
          message
        };
      },
    }),
    {
      name: "auth",
      whitelist: ["user", "accessToken", "modules", "supportedCountries"],
    }
  )
);

useAuthentication.subscribe((state) => {
  api.defaults.headers.common.Authorization = `Bearer ${state.accessToken}`;
});

export default useAuthentication;
