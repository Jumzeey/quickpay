import { checkExportStatus, getMerchantBalance, getWalletHistory } from '@/services/transaction';
import { notifyError } from '@/util/utils';
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
  accounts: Account[];
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
  exportWalletHistory: (searchParams?: FetchWalletHistoryParams) => Promise<{ success: boolean; export_link?: string }>;
  pollExportStatus: (jobId: number) => Promise<string>;
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

const getAccountId = async (currency: CurrencyOption): Promise<string> => {
  // Get currency store methods
  const currencyStore = useCurrency.getState();
  let accountId = currencyStore.getAccountId(currency as CurrencyOption);

  // If no account ID exists for this currency, fetch it first
  if (!accountId) {
    console.log(`No account found for ${currency}, fetching account info...`);

    const balanceResponse: MerchantBalanceResponse = await getMerchantBalance(currency);
    const accounts = balanceResponse?.accounts || [];

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

      console.log(`Account info saved for ${currency}:`, accountInfo);
    } else {
      throw new Error(`No main account found for currency: ${currency}`);
    }
  }

  return accountId;
}

const POLLING_INTERVAL = 5000;
const MAX_RETRIES = 20;


const useWalletLogs = create<WalletLogsState>((set, get) => ({
  ...initialState,

  fetchWalletHistory: async (searchParams?: FetchWalletHistoryParams): Promise<{ wallet: WalletTransaction[] }> => {
    set(state => ({
      ...state,
      getWalletHistoryLoading: true,
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

      return { wallet };
    } catch (error: any) {
      console.error('Error fetching wallet history:', error);
      // if (!error.message.includes('No transaction record found')) {
      //   notifyError(error.message);
      // } else {
      notifyError("Failed to fetch wallet history.");
      // }
      set(state => ({
        ...state,
        getWalletHistoryLoading: false,
      }));
      throw error;
    }
  },

  pollExportStatus: async (jobId: number): Promise<string> => {
    let retries = 0;

    const checkStatus = async (): Promise<string> => {
      try {
        const response = await checkExportStatus(jobId);

        if (response.data.status === 'completed' && response.data.export_url) {
          return response.data.export_url;
        }

        if (response.data.status === 'failed') {
          throw new Error('Export failed');
        }

        if (retries >= MAX_RETRIES) {
          throw new Error('Export timed out');
        }

        retries++;
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        return checkStatus();
      } catch (error) {
        throw error;
      }
    };

    return checkStatus();
  },

  exportWalletHistory: async (searchParams: FetchWalletHistoryParams = {}) => {
    try {
      let { currency = 'NGN', ...otherParams } = searchParams || {};

      // Fetch wallet history with account_id
      const params: FetchWalletHistoryParams = {
        ...otherParams,
        account_id: await getAccountId(currency),
        export: true,
      };

      console.log('Exporting wallet history with params:', params, searchParams);

      const response: ExportJobResponse = await getWalletHistory(params);
      if (response.export_link) {
        set(state => ({ ...state, isExporting: false }));

        return {
          success: true,
          export_link: response.export_link
        };
      }

      if (!response?.job_id) {
        throw new Error('No job ID received');
      }

      // Poll for the export URL
      const exportUrl = await get().pollExportStatus(response.job_id);

      set(state => ({ ...state, isExporting: false }));
      return {
        success: true,
        export_link: exportUrl
      };
    } catch (error: any) {
      set(state => ({ ...state, isExporting: false }));
      throw error;
    }
  },


}));

export default useWalletLogs;
export type { FetchWalletHistoryParams, Pagination, WalletLogsState, WalletTransaction };
