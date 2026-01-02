import {
  CollectionHistoryResponse,
  CollectionsTypes,
} from "@/components/collections/types";
import {
  createVirtualAccount,
  getCollectionHistory,
  getPaymentMandates,
  getRefunds,
  getSingleRefund,
  getVirtualAccounts,
  VirtualAccountFormValues,
} from "@/services/collections";
import { Pagination } from "@/stores/useWalletLogs";
import useKyc from "@/stores/useKyc";
import { KycStatus } from "@/types/kyc";
import { notifyError } from "@/util/utils";
import { create } from "zustand";
import router from "next/router";

export interface VirtualAccount {
  id: string;
  account_number: string;
  bank_name: string;
  created_at: string;
  [key: string]: any;
}

export interface PaymentMandate {
  id: string;
  status: string;
  created_at: string;
  [key: string]: any;
}

export interface Refund {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  [key: string]: any;
}

export interface SearchParams {
  page?: number;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  [key: string]: any;
}

interface CollectionHistoryState {
  getCollectionHistoryLoading: boolean;
  createVirtualAccountLoading: boolean;
  getVirtualAccountsHistoryLoading: boolean;
  getPaymentMandateLoading: boolean;
  getRefundLoading?: boolean;
  virtual_accounts: unknown[];
  refund: unknown[];
  collections: CollectionsTypes[];
  mandates?: unknown[];
  pagination: Pagination;
  showFilter: boolean;
  refundError?: string;
}

const initialState: CollectionHistoryState = {
  getCollectionHistoryLoading: false,
  createVirtualAccountLoading: false,
  getVirtualAccountsHistoryLoading: false,
  getPaymentMandateLoading: false,
  virtual_accounts: [],
  refund: [],
  collections: [],
  pagination: {
    count: 0,
    total: 0,
    per_page: 0,
    current_page: 1,
    last_page: 1,
  },
  showFilter: false,
};

interface CollectionHistoryStore extends CollectionHistoryState {
  fetchCollectionHistory: (
    searchParams?: SearchParams
  ) => Promise<{ collections: CollectionsTypes[] }>;
  fetchVirtualAccounts: (
    searchParams?: SearchParams
  ) => Promise<{ virtual_accounts: VirtualAccount[] }>;
  fetchPaymentMandates: (
    searchParams: SearchParams
  ) => Promise<{ mandates: PaymentMandate[] }>;
  fetchRefund: (id: string) => Promise<{ refund: Refund[]; error?: any }>;
  fetchRefunds: (searchParams: SearchParams) => Promise<{ refund: Refund[] }>;
}

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const useCollectionHistory = create<CollectionHistoryStore>((set, get) => ({
  ...initialState,

  fetchCollectionHistory: async (searchParams?: SearchParams) => {
    set((state) => ({
      ...state,
      getCollectionHistoryLoading: true,
    }));
    try {
      const params = {
        ...searchParams,
        ...(searchParams &&
          searchParams.startDate &&
          searchParams.endDate && {
            start_date: formatDate(searchParams.startDate),
            end_date: formatDate(searchParams.endDate),
          }),
      };
      const { collections = [], pagination } =
        ((await getCollectionHistory(params)) as CollectionHistoryResponse) ||
        {};
      set((state) => ({
        ...state,
        collections,
        pagination: pagination || initialState.pagination,
      }));
      return { collections };
    } finally {
      set((state) => ({
        ...state,
        getCollectionHistoryLoading: false,
      }));
    }
  },

  fetchVirtualAccounts: async (searchParams?: SearchParams) => {
    set((state) => ({
      ...state,
      getVirtualAccountsHistoryLoading: true,
    }));
    try {
      const params = {
        ...(searchParams || {}),
        ...(searchParams &&
          searchParams.startDate &&
          searchParams.endDate && {
            start_date: formatDate(searchParams.startDate),
            end_date: formatDate(searchParams.endDate),
          }),
      };
      const { virtual_accounts = [], pagination } =
        (await getVirtualAccounts(params)) || {};
      set((state) => ({
        ...state,
        virtual_accounts,
        pagination: pagination || initialState.pagination,
      }));
      return { virtual_accounts };
    } catch (error: any) {
      // Check if error is about Accept header (which indicates KYC not submitted)
      const errorMessage = error?.message || error?.responseText || "";
      if (
        errorMessage.includes("Accept") &&
        errorMessage.includes("application/json")
      ) {
        try {
          // Check KYC status
          const { getKyc } = useKyc.getState();
          const { userKyc } = await getKyc();

          // If KYC status is "Pending", "Unverified", or "Rejected", redirect to your-business page
          const status = userKyc?.status as KycStatus | string;
          if (
            status === KycStatus.PENDING ||
            status === KycStatus.UNVERIFIED ||
            status === KycStatus.REJECTED ||
            !userKyc?.fields ||
            userKyc?.fields?.length === 0
          ) {
            notifyError(
              "Please complete your KYC verification to access virtual accounts. You will be redirected to complete your business verification.",
              "KYC Verification Required"
            );
            router.push("/your-business");
            return { virtual_accounts: [] };
          }
        } catch (kycError) {
          // If getKyc fails, still redirect to your-business page
          notifyError(
            "Please complete your KYC verification to access virtual accounts. You will be redirected to complete your business verification.",
            "KYC Verification Required"
          );
          router.push("/your-business");
          return { virtual_accounts: [] };
        }
      }
      // Error will be handled by the onError callback in the component
      throw error;
    } finally {
      set((state) => ({
        ...state,
        getVirtualAccountsHistoryLoading: false,
      }));
    }
  },

  createVirtualAccount: async (payload: FormData) => {
    set((state) => ({
      ...state,
      createVirtualAccountLoading: true,
    }));
    try {
      const response = await createVirtualAccount(payload);
      set((state) => ({
        ...state,
        virtual_accounts: [...state.virtual_accounts, response],
      }));
      await get().fetchVirtualAccounts();
      return response;
    } catch (error) {
      console.error("Error creating virtual account:", error);
      throw error;
    } finally {
      set((state) => ({
        ...state,
        createVirtualAccountLoading: false,
      }));
    }
  },

  fetchPaymentMandates: async (searchParams: SearchParams) => {
    set((state) => ({
      ...state,
      getPaymentMandateLoading: true,
    }));
    try {
      const params = {
        ...searchParams,
        ...(searchParams.startDate &&
          searchParams.endDate && {
            start_date: formatDate(searchParams.startDate),
            end_date: formatDate(searchParams.endDate),
          }),
      };
      const { mandates = [], pagination } =
        (await getPaymentMandates(params)) || {};
      set((state) => ({
        ...state,
        mandates,
        pagination: pagination || initialState.pagination,
      }));
      return { mandates };
    } finally {
      set((state) => ({
        ...state,
        getPaymentMandateLoading: false,
      }));
    }
  },

  fetchRefund: async (id: string) => {
    set((state) => ({
      ...state,
      getRefundLoading: true,
    }));

    try {
      const refund = await getSingleRefund(id);
      set((state) => ({
        ...state,
        refund: refund || [],
      }));
      return { refund: refund || [] };
    } catch (error: any) {
      const status = error?.response?.status;

      if (status >= 400 && status < 600) {
        console.error(
          "Refund fetch error:",
          error?.response?.data || error.message
        );
        set((state) => ({
          ...state,
          refund: [],
          refundError: error?.response?.data?.message || "An error occurred",
        }));
        return { refund: [], error: error?.response?.data };
      }

      if (error?.message) {
        set((state) => ({
          ...state,
          refund: [],
          refundError: error?.response?.data?.message || "An error occurred",
        }));
        return { refund: [], error: error?.response?.data };
      }

      throw error;
    } finally {
      set((state) => ({
        ...state,
        getRefundLoading: false,
      }));
    }
  },

  fetchRefunds: async (searchParams: SearchParams) => {
    set((state) => ({
      ...state,
      getRefundLoading: true,
    }));
    try {
      const params = {
        ...searchParams,
        ...(searchParams.startDate &&
          searchParams.endDate && {
            start_date: formatDate(searchParams.startDate),
            end_date: formatDate(searchParams.endDate),
          }),
      };
      const { refund = [], pagination } = (await getRefunds(params)) || {};
      set((state) => ({
        ...state,
        refund,
        pagination: pagination || initialState.pagination,
      }));
      return { refund };
    } finally {
      set((state) => ({
        ...state,
        getRefundLoading: false,
      }));
    }
  },
}));

export default useCollectionHistory;
