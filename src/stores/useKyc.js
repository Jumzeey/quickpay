import { create } from "zustand";
import {
  getKycMethods,
  getKyc,
  createKyc,
} from "@/services/kyc";
import { persist } from "zustand/middleware";

const initialState = {
  getKycLoading: false,
  getKycMethodsLoading: false,
  createKycLoading: false,
};

const useKyc = create(
  persist(
    (set, get) => ({
      ...initialState,
      createKyc: async (payload) => {
        set((state) => ({
          ...state,
          createKycLoading: true,
        }));
        const { data, message } = await createKyc(payload);
        set((state) => ({
          ...state,
          message,
        }));
        return { message };
      },
      getKyc: async () => {
        set((state) => ({
          ...state,
          getKycLoading: true
        }));
        try {
          const { data } = await getKyc();
          set((state) => ({
            ...state,
            userKyc: data?.[0][0],
          }));
          return { 
            userKyc: data?.[0][0] 
          };
        } finally {
          set((state) => ({
            ...state,
            getKycLoading: false,
          }));
        }
      },
      setKycLoading: async (value) => {
        set((state) => ({
          ...state,
          getKycLoading: value
        }));
      },
      getKycMethods: async (payload) => {
        set((state) => ({
          ...state,
          getKycMethodsLoading: true,
        }));
        const { data, message } = await getKycMethods(payload);
        set((state) => ({
          ...state,

        }));
        return {
        };
      },
    }),
    {
      name: "kyc",
      whitelist: [],
    }
  )
);


export default useKyc;