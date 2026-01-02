import { createKyc, getKyc, getKycMethods } from "@/services/kyc";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface KycState {
  getKycLoading: boolean;
  getKycMethodsLoading: boolean;
  createKycLoading: boolean;
  userKyc?: any;
  message?: string;

  // Methods
  createKyc: (payload: any) => Promise<{ message?: string }>;
  getKyc: () => Promise<{ userKyc?: any }>;
  setKycLoading: (value: boolean) => void;
  getKycMethods: (payload: any) => Promise<any>;
}

const initialState = {
  getKycLoading: false,
  getKycMethodsLoading: false,
  createKycLoading: false,
};

const useKyc = create<KycState>()(
  persist(
    (set, get) => ({
      ...initialState,
      createKyc: async (payload) => {
        set((state) => ({
          ...state,
          createKycLoading: true,
        }));
        const { data, message } = (await createKyc(payload)) as any;
        set((state) => ({
          ...state,
          message,
          createKycLoading: false,
        }));
        return { message };
      },
      getKyc: async () => {
        set((state) => ({
          ...state,
          getKycLoading: true,
        }));
        try {
          const { data } = await getKyc();

          // Handle new account structure: { data: { status: "Pending" } }
          if (
            data &&
            typeof data === "object" &&
            !Array.isArray(data) &&
            "status" in data &&
            !("fields" in data)
          ) {
            const userKyc = {
              status: data.status,
              fields: [],
              created_at: null,
            };
            set((state) => ({
              ...state,
              userKyc,
            }));
            return {
              userKyc,
            };
          }

          // Handle existing account structure: { data: [[{ fields: [...], status: ... }]] }
          const userKyc = data?.[0]?.[0] || null;
          set((state) => ({
            ...state,
            userKyc,
          }));
          return {
            userKyc,
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
          getKycLoading: value,
        }));
      },
      getKycMethods: async () => {
        set((state) => ({
          ...state,
          getKycMethodsLoading: true,
        }));
        const { data, message } = (await getKycMethods()) as any;
        set((state) => ({
          ...state,
          getKycMethodsLoading: false,
        }));
        return {
          data,
          message,
        };
      },
    }),
    {
      name: "kyc",
    }
  )
);

export default useKyc;
