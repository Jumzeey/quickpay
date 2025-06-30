import {
  getCollectionHistory,
  getPaymentMandates,
  getRefunds,
  getSingleRefund,
  getVirtualAccounts,
} from '@/services/collections';
import { create } from 'zustand';

const initialState = {
  getCollectionHistoryLoading: false,
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

const useCollectionHistory = create((set, get) => ({
  ...initialState,
  fetchCollectionHistory: async searchParams => {
    set(state => ({
      ...state,
      getCollectionHistoryLoading: true,
    }));
    try {
      let params = searchParams;
      if (searchParams.startDate && searchParams.endDate) {
        params = {
          ...params,
          start_date: formatDate(searchParams.startDate),
          end_date: formatDate(searchParams.endDate),
        };
      }
      const { collections, pagination } =
        (await getCollectionHistory(params)) || {};
      set(state => ({
        ...state,
        collections,
        pagination,
      }));
      return { collections };
    } finally {
      set(state => ({
        ...state,
        getCollectionHistoryLoading: false,
      }));
    }
  },
  fetchVirtualAccounts: async searchParams => {
    set(state => ({
      ...state,
      getVirtualAccountsHistoryLoading: true,
    }));
    try {
      let params = searchParams;
      if (searchParams?.startDate && searchParams?.endDate) {
        params = {
          ...params,
          start_date: formatDate(searchParams.startDate),
          end_date: formatDate(searchParams.endDate),
        };
      }
      const { virtual_accounts, pagination } =
        (await getVirtualAccounts(params)) || {};
      set(state => ({
        ...state,
        virtual_accounts,
        pagination,
      }));
      return { virtual_accounts };
    } finally {
      set(state => ({
        ...state,
        getVirtualAccountsHistoryLoading: false,
      }));
    }
  },
  fetchPaymentMandates: async searchParams => {
    set(state => ({
      ...state,
      getPaymentMandateLoading: true,
    }));
    try {
      let params = searchParams;
      if (searchParams.startDate && searchParams.endDate) {
        params = {
          ...params,
          start_date: formatDate(searchParams.startDate),
          end_date: formatDate(searchParams.endDate),
        };
      }
      const { mandates, pagination } = (await getPaymentMandates(params)) || {};
      set(state => ({
        ...state,
        mandates,
        pagination,
      }));
      return { mandates };
    } finally {
      set(state => ({
        ...state,
        getPaymentMandateLoading: false,
      }));
    }
  },
  fetchRefund: async id => {
    set(state => ({
      ...state,
      getRefundLoading: true,
    }));

    try {
      const refund = await getSingleRefund(id);
      set(state => ({
        ...state,
        refund: refund || [],
      }));
      return { refund };
    } catch (error) {
      const status = error?.response?.status;

      if (status >= 400 && status < 600) {
        console.error(
          'Refund fetch error:',
          error?.response?.data || error.message
        );
        set(state => ({
          ...state,
          refund: [],
          refundError: error?.response?.data?.message || 'An error occurred',
        }));
        return { refund: [], error: error?.response?.data };
      }

      if (error?.message) {
        set(state => ({
          ...state,
          refund: [],
          refundError: error?.response?.data?.message || 'An error occurred',
        }));
        console.log(
          'Refund fetch error:',
          error?.response?.data || error.message
        );
        return { refund: [], error: error?.response?.data };
      }

      throw error; // rethrow unexpected errors
    } finally {
      set(state => ({
        ...state,
        getRefundLoading: false,
      }));
    }
  },
  fetchRefunds: async searchParams => {
    set(state => ({
      ...state,
      getRefundLoading: true,
    }));
    try {
      let params = searchParams;
      if (searchParams.startDate && searchParams.endDate) {
        params = {
          ...params,
          start_date: formatDate(searchParams.startDate),
          end_date: formatDate(searchParams.endDate),
        };
      }
      const { refund, pagination } = (await getRefunds(params)) || {};
      set(state => ({
        ...state,
        refund,
        pagination,
      }));
      return { refund };
    } finally {
      set(state => ({
        ...state,
        getRefundLoading: false,
      }));
    }
  },
}));

export default useCollectionHistory;
