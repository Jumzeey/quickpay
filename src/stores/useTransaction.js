import { getMerchantBalance, getWalletHistory } from '@/services/transaction';
import { notifyError } from '@/util/utils';
import { create } from 'zustand';
import useCurrency from './useCurrency';

const initialState = {
  wallet: [],
  pagination: {
    count: 0,
    total: 0,
    per_page: 20,
    current_page: 1,
    last_page: 1,
  },
  getWalletHistoryLoading: false,
};

const useTransaction = create((set, get) => ({
  ...initialState,

  fetchWalletHistory: async (searchParams) => {
    set(state => ({
      ...state,
      getWalletHistoryLoading: true,
    }));

    try {
      const { currency = 'NGN', ...otherParams } = searchParams || {};

      // Get currency store methods
      const currencyStore = useCurrency.getState();
      let accountId = currencyStore.getAccountId(currency);

      // If no account ID exists for this currency, fetch it first
      if (!accountId) {
        const balanceResponse = await getMerchantBalance(currency);
        const accounts = balanceResponse?.accounts || [];

        // Find main and reserve accounts
        const mainAccount = accounts.find(acc => acc.account_type === 'main');
        const reserveAccount = accounts.find(acc => acc.account_type === 'reserve');

        if (mainAccount) {
          const accountInfo = {
            main_account_id: mainAccount.id,
            ...(reserveAccount && { rolling_reserve_account_id: reserveAccount.id })
          };

          // Save accounts to currency store
          currencyStore.setAccounts(currency, accountInfo);
          accountId = mainAccount.id;
        } else {
          throw new Error(`No main account found for currency: ${currency}`);
        }
      }

      // Fetch wallet history with account_id
      const params = {
        ...otherParams,
        // currency,
        account_id: accountId,
      };

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
          current_page: searchParams?.page || 1,
          last_page: total ? Math.ceil(total / state.pagination.per_page) : 1,
        },
        getWalletHistoryLoading: false,
      }));

      return { wallet };
    } catch (error) {
      console.error('Error fetching wallet history:', error);
      if (!error.message.includes('No transaction record found')) {
        notifyError(error.message);
      }
      set(state => ({
        ...state,
        getWalletHistoryLoading: false,
      }));
      throw error;
    }
  },
}));

export default useTransaction;
