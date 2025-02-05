import { create } from "zustand";
import { signIn, signUp, verifyOtp, resendOtp, newPassword, forgotPassword, forgotPasswordOtp,logOut,verifyEmail } from "@/services/authentication";
import { persist } from "zustand/middleware";
import api from "@/util/api";
import Cookies from "js-cookie";

const accessGet = globalThis.localStorage?.getItem('auth');
const accessGetParse = accessGet ? JSON?.parse(accessGet) : null;
const initialState = {
  accessToken: accessGetParse?.state?.accessToken || null,
  user: accessGetParse?.state?.user || null,
  signInLoading: false,
  signUpLoading: false,
  resetPasswordOtpLoading:false,
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
      verifyOtp: async (payload) => {
        set((state) => ({
          ...state,
        }));
        const { data, message } = await verifyOtp(payload);
        Cookies.set('accessToken', data.token);
        set((state) => ({
          ...state,
          user: data.user,
          accessToken: data.token,
        }));
        return {
          user: data.user,
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
          verify_reference: data.verify_reference, user: data.user,
          accessToken: data.token, message
        };
      },
    }),
    {
      name: "auth",
      whitelist: ["user", "accessToken"],
    }
  )
);

useAuthentication.subscribe((state) => {
  api.defaults.headers.common.Authorization = `Bearer ${state.accessToken}`;
});

export default useAuthentication;
