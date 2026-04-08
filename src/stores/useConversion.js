import {
  addConversion,
  getConversionHistory,
  verifyConversionOtp,
  viewConversion,
} from "@/services/conversions";
import { create } from "zustand";

const initialState = {
  postConversionamountLoading: false,
  verifyConversionOtp: false,
  viewConversionLoading: false,
  conversions: [],
  pagination: {
    count: 0,
    total: 0,
    per_page: 0,
    current_page: 1,
    last_page: 1,
  },
};

const useConversion = create((set, get) => ({
  ...initialState,
  postConversionAccount: async (payload) => {
    set((state) => ({
      ...state,
    }));
    const { data, message } = await addConversion(payload);
    set((state) => ({
      ...state,
      disburse: data,
      disburse_payload: payload,
    }));
    return {
      message,
      disburse: data,
      disburse_payload: payload,
    };
  },
  fetchConversionHistory: async (searchParams) => {
    set((state) => ({
      ...state,
      getConversionHistoryLoading: true,
    }));
    try {
      let params = searchParams;
      const result = (await getConversionHistory(params)) || {};
      const { conversions = [], pagination = {} } = result;
      set((state) => ({
        ...state,
        conversions,
        pagination,
      }));
      return { conversions };
    } finally {
      set((state) => ({
        ...state,
        getConversionHistoryLoading: false,
      }));
    }
  },
}));

export default useConversion;
