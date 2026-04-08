import { getMerchantBalance, getWalletHistory } from '@/services/transaction';
import { create } from 'zustand';
import useCurrency, { CurrencyOption } from './useCurrency';

interface WalletTransaction {
  customer_reference: string;
  transaction_reference: string;
  ledger_balance_before_amount: string;
  ledger_balance_after_amount: string;
  amount: string;
  description: string;
  balance_type: string;
  transaction_type: string;
  payment_type: string;
  date: string;
  status: string;
  currency: string;
  available_balance_before: string;
  available_balance_after: string;
  locked_balance_before: string;
  locked_balance_after: string;
}

interface Pagination {
  count: number;
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

interface FetchWalletHistoryParams {
  currency?: CurrencyOption;
  page?: number;
  start_date?: string;
  end_date?: string;
  account_id?: string;
  [key: string]: any;
}

interface Account {
  id: string;
  account_type: 'main' | 'reserve';
  currency: string;
  available_balance: string;
  actual_balance: string;
  locked_balance: string;
}

interface MerchantBalanceResponse {
  accounts: Account[] | { message: string };
  [key: string]: any;
}

interface WalletHistoryResponse {
  wallet: WalletTransaction[];
  [key: string]: any;
}

interface ExportJobResponse {
  job_id?: number;
  status: string;
  export_link?: string;
}

interface WalletLogsState {
  wallet: WalletTransaction[];
  pagination: Pagination;
  getWalletHistoryLoading: boolean;
  isExporting: boolean;
  fetchWalletHistory: (params?: FetchWalletHistoryParams) => Promise<{ wallet: WalletTransaction[] }>;
  // exportWalletHistory: (searchParams?: FetchWalletHistoryParams) => Promise<{ success: boolean; export_link?: string }>;
  // pollExportStatus: (jobId: number) => Promise<string>;
}

const initialState: Omit<WalletLogsState, 'fetchWalletHistory' | 'exportWalletHistory' | 'pollExportStatus'> = {
  wallet: [],
  pagination: {
    count: 0,
    total: 0,
    per_page: 20,
    current_page: 1,
    last_page: 1,
  },
  isExporting: false,
  getWalletHistoryLoading: false,
};

export const getAccountId = async (currency: CurrencyOption): Promise<string> => {
  // Get currency store methods
  const currencyStore = useCurrency.getState();
  let accountId = currencyStore.getAccountId(currency as CurrencyOption);

  // If no account ID exists for this currency, fetch it first
  if (!accountId) {
    console.log(`No account found for ${currency}, fetching account info...`);

    const balanceResponse: MerchantBalanceResponse = await getMerchantBalance(currency);
    
    // Check if accounts is an array or an object with a message
    const accounts = balanceResponse?.accounts;
    
    // If accounts is not an array or is empty, throw an error
    if (!Array.isArray(accounts)) {
      const errorMessage = typeof accounts === 'object' && 'message' in accounts
        ? accounts.message 
        : `No accounts found for currency: ${currency}`;
      throw new Error(errorMessage);
    }
    
    if (accounts.length === 0) {
      throw new Error(`No accounts found for currency: ${currency}`);
    }

    // Find main and reserve accounts
    const mainAccount = accounts.find((acc: Account) => acc.account_type === 'main');
    const reserveAccount = accounts.find((acc: Account) => acc.account_type === 'reserve');

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

  return accountId;
}

const useWalletLogs = create<WalletLogsState & { currentCurrency: CurrencyOption }>((set, get) => ({
  ...initialState,
  currentCurrency: 'NGN', // Default currency

  fetchWalletHistory: async (searchParams?: FetchWalletHistoryParams): Promise<{ wallet: WalletTransaction[] }> => {
    const previousCurrency = get().currentCurrency;
    const currentCurrency = searchParams?.currency || 'NGN';

    set(state => ({
      ...state,
      getWalletHistoryLoading: true,
      currentCurrency, // Update the current currency
    }));

    try {
      let { currency = 'NGN', ...otherParams } = searchParams || {};

      // Fetch wallet history with account_id
      const params: FetchWalletHistoryParams = {
        ...otherParams,
        account_id: await getAccountId(currency),
      };

      const response: WalletHistoryResponse = await getWalletHistory(params);
      const { wallet } = response;
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

      // @ts-ignore
      return { wallet };
    } catch (error: any) {
      console.error('Error fetching wallet history:', error);
      // Error handling moved to component level with useApiResponse hook

      // if the current account is not the same as previous, reset wallet logs
      const currencyChanged = previousCurrency !== get().currentCurrency;

      set(state => ({
        ...state,
        getWalletHistoryLoading: false,
        // Reset wallet data if currency changed
        ...(currencyChanged && { wallet: [], pagination: initialState.pagination }),
      }));
      throw error;
    }
  },
}));

export default useWalletLogs;
export type { FetchWalletHistoryParams, Pagination, WalletLogsState, WalletTransaction };
