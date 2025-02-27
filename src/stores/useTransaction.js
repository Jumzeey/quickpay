import { create } from "zustand";
import { getWalletHistory } from "@/services/transaction";
import moment from "moment";
import { notifyError } from "@/util/utils";

const initialState = {
  wallet_history: [],
  pagination: {
    count: 0,
    total: 0,
    per_page: 10,
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
      const wallet_history = await getWalletHistory(params);
      const total = wallet_history.length;

      set(state => ({
        ...state,
        wallet_history,
        pagination: {
          ...state.pagination,
          count: 20,
          per_page: searchParams.per_page || 20,
          total: total,
          current_page: searchParams.page || 1,
          last_page: total ? Math.ceil(total / state.pagination.per_page) : 1,
        },
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
