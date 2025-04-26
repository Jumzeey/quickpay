import { create } from 'zustand';
import { getWalletHistory } from '@/services/transaction';
import moment from 'moment';
import { notifyError } from '@/util/utils';

const initialState = {
  wallet: [],
  pagination: {
    count: 0,
    total: 0,
    per_page: 20,
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
      const { wallet } = await getWalletHistory(params);
      const total = wallet.length;

      set(state => ({
        ...state,
        wallet,
        pagination: {
          ...state.pagination,
          count: 20,
          per_page: state.pagination.per_page,
          total: total,
          current_page: searchParams.page || 1,
          last_page: total ? Math.ceil(total / state.pagination.per_page) : 1,
        },
      }));
      return { wallet };
    } catch (error) {
      if (!error.message.includes('No transaction record found')) {
        notifyError(error.message);
      }
    } finally {
      set(state => ({
        ...state,
        getWalletHistoryLoading: false,
      }));
    }
  },
}));

export default useTransaction;
