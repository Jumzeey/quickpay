import { create } from "zustand";
import { getWalletHistory } from "@/services/transaction";
import moment from "moment";
import { notifyError } from "@/util/utils";

const initialState = {
  wallet_history: [],
  pagination: {
    count: 0,
    total: 0,
    per_page: 0,
    current_page: 1,
    last_page: 1,
  },
};

const useTransaction = create((set, get) => ({
  ...initialState,
  fetchWalletHistory: async searchParams => {
    set(state => ({
      ...state,
      getWalletHistoryLoading: true,
    }));
    try {
      let params = searchParams;
      const { wallet_history, pagination } = await getWalletHistory(params);
      set(state => ({
        ...state,
        wallet_history,
        pagination,
      }));
      return { wallet_history };
    } catch (error) {
      notifyError(error.message);
    } finally {
      set(state => ({
        ...state,
        getWalletHistoryLoading: false,
      }));
    }
  },
}));

export default useTransaction;
